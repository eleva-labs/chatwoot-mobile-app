#!/bin/bash
#
# env-utils.sh - Environment file manipulation utilities
#
# This utility provides functions to update .env files while preserving
# all formatting, comments, and blank lines.
#
# Usage:
#   source "$PROJECT_ROOT/scripts/utils/env-utils.sh"
#   set_env_value "KEY" "value"
#   set_env_value "KEY" "value" "/path/to/.env"
#
# Functions:
#   set_env_value KEY VALUE [FILE]     - Set a single env value
#   set_env_values KEY1=val1 KEY2=val2 - Set multiple env values
#   get_env_value KEY [FILE]           - Get an env value
#   has_env_key KEY [FILE]             - Check if key exists
#

# Determine PROJECT_ROOT if not already set
if [[ -z "$PROJECT_ROOT" ]]; then
    # Try to find project root by looking for package.json
    _ENV_UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$_ENV_UTILS_DIR/../.." && pwd)"
fi

# Default .env path (can be overridden by setting ENV_FILE before sourcing)
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env}"

#######################################
# Set a value in .env file, preserving formatting
#
# Updates an existing key in-place or appends a new key at the end.
# Preserves all comments, blank lines, and formatting.
# Uses atomic writes (temp file + mv) to prevent corruption.
#
# Arguments:
#   $1 - Key name (required)
#   $2 - Value (required, can be empty string)
#   $3 - File path (optional, defaults to $ENV_FILE)
#
# Returns:
#   0 on success, 1 on error
#
# Example:
#   set_env_value "FIREBASE_PROJECT_ID" "my-project"
#   set_env_value "API_KEY" "secret" "/path/to/.env"
#######################################
set_env_value() {
    local key="$1"
    local value="$2"
    local file="${3:-$ENV_FILE}"

    # Validate key is provided
    if [[ -z "$key" ]]; then
        echo "Error: Key is required" >&2
        return 1
    fi

    # Validate key format (must start with letter or underscore, then alphanumeric/underscore)
    if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        echo "Error: Invalid key format: $key (must be alphanumeric with underscores)" >&2
        return 1
    fi

    # Create file if it doesn't exist
    if [[ ! -f "$file" ]]; then
        # Ensure parent directory exists
        local dir
        dir="$(dirname "$file")"
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir" || {
                echo "Error: Cannot create directory: $dir" >&2
                return 1
            }
        fi
        touch "$file" || {
            echo "Error: Cannot create file: $file" >&2
            return 1
        }
    fi

    # Create temp file in the same directory for atomic write
    local temp_file
    temp_file="$(mktemp "${file}.XXXXXX")" || {
        echo "Error: Cannot create temp file" >&2
        return 1
    }

    # Ensure temp file is cleaned up on error
    trap "rm -f '$temp_file'" RETURN

    local key_found=false
    local line_num=0
    local first_occurrence_updated=false

    # Process file line by line, preserving exact content
    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_num++))

        # Check if this line sets our key (not commented out)
        # Pattern: optional whitespace, then KEY=, capturing from start of line
        # We use a simpler pattern to avoid regex escaping issues with the key
        if [[ "$first_occurrence_updated" == "false" ]]; then
            # Extract potential key from the line
            # Handle lines like: KEY=value, KEY="value", KEY=
            if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
                local line_key="${BASH_REMATCH[1]}"
                if [[ "$line_key" == "$key" ]]; then
                    # This is our key - replace the entire line
                    printf '%s\n' "${key}=${value}" >> "$temp_file"
                    key_found=true
                    first_occurrence_updated=true
                    continue
                fi
            fi
        fi

        # Keep line as-is (includes comments, blank lines, other keys, duplicate keys after first)
        printf '%s\n' "$line" >> "$temp_file"
    done < "$file"

    # If key wasn't found, append it at the end
    if [[ "$key_found" == "false" ]]; then
        # Check if file is non-empty and doesn't end with newline
        if [[ -s "$temp_file" ]]; then
            local last_char
            last_char=$(tail -c 1 "$temp_file" 2>/dev/null | od -c | head -1 | awk '{print $2}')
            # If file doesn't end with newline, the last read would have left content without newline
            # Our printf already adds newlines, so we just need to add the new key
        fi
        printf '%s\n' "${key}=${value}" >> "$temp_file"
    fi

    # Atomic replace - move temp file to target
    mv "$temp_file" "$file" || {
        echo "Error: Cannot write to file: $file" >&2
        rm -f "$temp_file"
        return 1
    }

    # Clear the trap since we successfully moved the file
    trap - RETURN

    return 0
}

#######################################
# Get a value from .env file
#
# Reads the value of a key from the .env file.
# Only reads uncommented, active key-value pairs.
#
# Arguments:
#   $1 - Key name (required)
#   $2 - File path (optional, defaults to $ENV_FILE)
#
# Outputs:
#   Value to stdout (may be empty if key exists with empty value)
#
# Returns:
#   0 if key found, 1 if not found or file doesn't exist
#
# Example:
#   value=$(get_env_value "FIREBASE_PROJECT_ID")
#   if get_env_value "API_KEY" > /dev/null; then echo "Key exists"; fi
#######################################
get_env_value() {
    local key="$1"
    local file="${2:-$ENV_FILE}"

    # Validate key is provided
    if [[ -z "$key" ]]; then
        echo "Error: Key is required" >&2
        return 1
    fi

    # Check file exists
    if [[ ! -f "$file" ]]; then
        return 1
    fi

    # Look for uncommented key=value line and extract value
    # Process line by line to handle edge cases properly
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip commented lines (lines starting with optional whitespace then #)
        if [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Check if line matches our key
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*) ]]; then
            local line_key="${BASH_REMATCH[1]}"
            local line_value="${BASH_REMATCH[2]}"
            if [[ "$line_key" == "$key" ]]; then
                # Found the key - output the value (may be empty)
                printf '%s\n' "$line_value"
                return 0
            fi
        fi
    done < "$file"

    # Key not found
    return 1
}

#######################################
# Check if a key exists in .env file
#
# Checks for an uncommented, active key (not commented out).
#
# Arguments:
#   $1 - Key name (required)
#   $2 - File path (optional, defaults to $ENV_FILE)
#
# Returns:
#   0 if key exists (uncommented), 1 if not found or file doesn't exist
#
# Example:
#   if has_env_key "FIREBASE_PROJECT_ID"; then
#       echo "Firebase is configured"
#   fi
#######################################
has_env_key() {
    local key="$1"
    local file="${2:-$ENV_FILE}"

    # Validate key is provided
    if [[ -z "$key" ]]; then
        echo "Error: Key is required" >&2
        return 1
    fi

    # Check file exists
    if [[ ! -f "$file" ]]; then
        return 1
    fi

    # Look for uncommented key=value line
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip commented lines
        if [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Check if line matches our key
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
            local line_key="${BASH_REMATCH[1]}"
            if [[ "$line_key" == "$key" ]]; then
                return 0
            fi
        fi
    done < "$file"

    # Key not found
    return 1
}

#######################################
# Set multiple values in .env file
#
# Convenience function to set multiple key-value pairs.
# Each argument should be in KEY=value format.
#
# Arguments:
#   $@ - KEY=value pairs (one or more)
#   Last argument can optionally be a file path if it contains "/"
#
# Returns:
#   0 on success, 1 on any error
#
# Example:
#   set_env_values "KEY1=value1" "KEY2=value2"
#   set_env_values "KEY1=value1" "KEY2=value2" "/path/to/.env"
#######################################
set_env_values() {
    local args=("$@")
    local file="$ENV_FILE"
    local result=0

    # Check if last argument is a file path (contains "/" or starts with ".")
    local last_arg="${args[${#args[@]}-1]}"
    if [[ "$last_arg" == *"/"* ]] || [[ "$last_arg" == .* && ! "$last_arg" == *"="* ]]; then
        file="$last_arg"
        unset 'args[${#args[@]}-1]'
    fi

    # Process each key=value pair
    for pair in "${args[@]}"; do
        # Skip empty arguments
        [[ -z "$pair" ]] && continue

        # Validate format (must contain =)
        if [[ "$pair" != *"="* ]]; then
            echo "Error: Invalid format '$pair' - expected KEY=value" >&2
            result=1
            continue
        fi

        # Split on first = only (value may contain =)
        local key="${pair%%=*}"
        local value="${pair#*=}"

        if ! set_env_value "$key" "$value" "$file"; then
            result=1
        fi
    done

    return $result
}
