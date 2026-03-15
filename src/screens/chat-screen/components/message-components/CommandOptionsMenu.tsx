import React from 'react';
import { Alert, Linking, Platform, Pressable, Text } from 'react-native';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';
import * as ImagePicker from 'expo-image-picker';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@application/store/hooks';
import { updateAttachments } from '@application/store/conversation/sendMessageSlice';
import { useRefsContext } from '@infrastructure/context';
import { AttachFileIcon, CameraIcon, MacrosIcon, PhotosIcon } from '@/svg-icons';
import { snappySlideInDown, snappySlideOutDown } from '@infrastructure/animation';
import { tailwind } from '@infrastructure/theme';
import { useHaptic, useScaleAnimation, processImageForUpload } from '@infrastructure/utils';
import { Icon } from '@infrastructure/ui/common';
import { MAXIMUM_FILE_UPLOAD_SIZE } from '@domain/constants';
import i18n from '@infrastructure/i18n';
import { showToast } from '@infrastructure/utils/toastUtils';
import { findFileSize } from '@infrastructure/utils/fileUtils';
import type { AppDispatch } from '@application/store';
import type { PickedAsset } from '@domain/types';

/**
 * Maps an expo-image-picker asset to the PickedAsset shape used by the Redux store.
 */
const mapExpoAsset = (asset: ImagePicker.ImagePickerAsset): PickedAsset => ({
  fileName: asset.fileName || `file-${Date.now()}`,
  fileSize: asset.fileSize || 0,
  type: asset.mimeType || asset.type || '',
  uri: asset.uri,
  duration: asset.duration != null ? asset.duration / 1000 : undefined,
});

export const handleOpenPhotosLibrary = async (dispatch: AppDispatch) => {
  const pickedAssets = await ImagePicker.launchImageLibraryAsync({
    quality: 1,
    selectionLimit: 4,
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FORM_SHEET,
  });
  if (pickedAssets.canceled) {
    // User cancelled
  } else if (pickedAssets.assets && pickedAssets.assets.length > 0) {
    for (const asset of pickedAssets.assets) {
      const mapped = mapExpoAsset(asset);
      const processed = await processImageForUpload(mapped);
      validateFileAndSetAttachments(dispatch, processed);
    }
  }
};

const handleLaunchCamera = async (dispatch: AppDispatch) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Denied',
      'The permission to access the camera has been denied and cannot be requested again. Please enable it in your device settings if you wish to use the camera feature.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
      { cancelable: false },
    );
    return;
  }
  const imageResult = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FORM_SHEET,
  });
  if (!imageResult.canceled && imageResult.assets && imageResult.assets.length > 0) {
    const asset = imageResult.assets[0];
    const mapped = mapExpoAsset(asset);
    const processed = await processImageForUpload(mapped);
    validateFileAndSetAttachments(dispatch, processed);
  }
};

/**
 * Doing this so that the our Store Object Attachments is of single type - PickedAsset
 * The function `mapObject` takes an object of type `DocumentPickerResponse` and returns an array of
 * `PickedAsset` objects with properties `fileName`, `fileSize`, `type`, and `uri`.
 * @param {DocumentPickerResponse} originalObject - The originalObject parameter is of type
 * DocumentPickerResponse.
 * @returns The function `mapObject` is returning an array of `PickedAsset` objects.
 */
const mapObject = (originalObject: DocumentPickerResponse): PickedAsset[] => {
  return [
    {
      fileName: originalObject.name || '',
      fileSize: originalObject.size || 0,
      type: originalObject.type || '',
      uri: originalObject.uri || '',
    },
  ];
};

const handleAttachFile = async (dispatch: AppDispatch) => {
  try {
    const result = await pick({
      type: [
        types.allFiles,
        types.images,
        types.plainText,
        types.audio,
        types.pdf,
        types.zip,
        ...[types.csv].flat(),
        types.doc,
        types.docx,
        types.ppt,
        types.pptx,
        types.xls,
        types.xlsx,
      ], // You can specify the file types you want to allow
      presentationStyle: 'formSheet',
    });
    // TODO: Support multiple files
    const file = mapObject(result[0])[0];
    const processed = await processImageForUpload(file);
    validateFileAndSetAttachments(dispatch, processed);
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
      // User cancelled the picker
    } else {
      throw err;
    }
  }
};

const ADD_MENU_OPTIONS = [
  {
    icon: <PhotosIcon />,
    key: 'photos',
    getTitle: () => i18n.t('CONVERSATION.ADD_MENU.PHOTOS'),
    handlePress: handleOpenPhotosLibrary,
  },
  {
    icon: <CameraIcon />,
    key: 'camera',
    getTitle: () => i18n.t('CONVERSATION.ADD_MENU.CAMERA'),
    handlePress: handleLaunchCamera,
  },
  {
    icon: <AttachFileIcon />,
    key: 'attach_file',
    getTitle: () => i18n.t('CONVERSATION.ADD_MENU.ATTACH_FILE'),
    handlePress: handleAttachFile,
  },
  {
    icon: <MacrosIcon />,
    key: 'macros',
    getTitle: () => i18n.t('CONVERSATION.ADD_MENU.MACROS'),
    handlePress: () => {},
  },
];

export const validateFileAndSetAttachments = async (
  dispatch: AppDispatch,
  attachment: PickedAsset | DocumentPickerResponse | Record<string, unknown>,
) => {
  const fileSize =
    'fileSize' in attachment
      ? (attachment.fileSize as number | undefined)
      : 'size' in attachment
        ? (attachment.size as number | undefined)
        : 0;
  if (findFileSize(fileSize ?? 0) <= MAXIMUM_FILE_UPLOAD_SIZE) {
    dispatch(updateAttachments([attachment as PickedAsset]));
  } else {
    showToast({ message: i18n.t('CONVERSATION.FILE_SIZE_LIMIT') });
  }
};

type MenuOptionProps = {
  index: number;
  menuOption: (typeof ADD_MENU_OPTIONS)[0];
};

const MenuOption = (props: MenuOptionProps) => {
  const { index, menuOption } = props;
  const dispatch = useAppDispatch();
  const { macrosListSheetRef } = useRefsContext();

  const { animatedStyle, handlers } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    menuOption?.handlePress(dispatch);
    if (menuOption.key === 'macros') {
      macrosListSheetRef.current?.present();
    }
  };

  return (
    <Animated.View style={[tailwind.style('mb-3'), animatedStyle]}>
      <Pressable onPress={handlePress} {...handlers}>
        <Animated.View key={index} style={[tailwind.style('flex-row items-center justify-start')]}>
          <Animated.View style={tailwind.style('p-2')}>
            <Icon icon={menuOption.icon} size={24} />
          </Animated.View>
          <Text
            style={tailwind.style(
              'text-base font-inter-normal-20 leading-[18px] tracking-[0.24px] text-slate-12 pl-5',
            )}>
            {menuOption.getTitle()}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const CommandOptionsMenu = () => {
  const { bottom } = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const containerHeight = isAndroid
    ? 210 + (bottom === 0 ? 16 : bottom)
    : 175 + (bottom === 0 ? 16 : bottom);
  return (
    <Animated.View
      entering={snappySlideInDown()}
      exiting={snappySlideOutDown()}
      style={tailwind.style('mx-1 pt-2 items-start', `h-[${containerHeight}px]`)}>
      {ADD_MENU_OPTIONS.map((menuOption, index) => {
        return <MenuOption key={menuOption.key} {...{ menuOption, index }} />;
      })}
    </Animated.View>
  );
};
