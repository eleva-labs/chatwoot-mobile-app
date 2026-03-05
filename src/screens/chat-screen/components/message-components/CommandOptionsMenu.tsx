import React from 'react';
import { Alert, Linking, Platform, Pressable, Text } from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/hooks';
import { updateAttachments } from '@application/store/conversation/sendMessageSlice';
import { useRefsContext } from '@infrastructure/context';
import { AttachFileIcon, CameraIcon, MacrosIcon, PhotosIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { useHaptic, useScaleAnimation } from '@infrastructure/utils';
import { Icon } from '@infrastructure/ui/common';
import { MAXIMUM_FILE_UPLOAD_SIZE } from '@domain/constants';
import i18n from '@infrastructure/i18n';
import { showToast } from '@infrastructure/utils/toastUtils';
import { findFileSize } from '@infrastructure/utils/fileUtils';
import type { AppDispatch } from '@application/store';

export const handleOpenPhotosLibrary = async (dispatch: AppDispatch) => {
  const pickedAssets = await launchImageLibrary({
    quality: 1,
    selectionLimit: 4,
    mediaType: 'mixed',
    presentationStyle: 'formSheet',
  });
  if (pickedAssets.didCancel) {
  } else if (pickedAssets.errorCode) {
    Alert.alert(
      'Permission Denied',
      pickedAssets.errorMessage ||
        'The permission to access the photo library has been denied and cannot be requested again. Please enable it in your device settings if you wish to access photos from your library.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            // Open app settings
            Linking.openSettings();
          },
        },
      ],
      { cancelable: false },
    );
  } else {
    if (pickedAssets.assets && pickedAssets.assets?.length > 0) {
      validateFileAndSetAttachments(dispatch, pickedAssets.assets[0]);
    }
  }
};

const handleLaunchCamera = async (dispatch: AppDispatch) => {
  request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then(
    async result => {
      if (RESULTS.BLOCKED === result) {
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
                // Open app settings
                Linking.openSettings();
              },
            },
          ],
          { cancelable: false },
        );
      }
      if (RESULTS.GRANTED === result) {
        const imageResult = await launchCamera({
          presentationStyle: 'formSheet',
          mediaType: 'mixed',
        });
        if (imageResult.didCancel) {
        } else if (imageResult.errorCode) {
        } else {
          if (imageResult.assets && imageResult.assets?.length > 0) {
            validateFileAndSetAttachments(dispatch, imageResult.assets[0]);
          }
        }
      }
    },
  );
};

/**
 * Doing this so that the our Store Object Attachments is of single type - Asset from Image Picker Library
 * The function `mapObject` takes an object of type `DocumentPickerResponse` and returns an array of
 * `Asset` objects with properties `fileName`, `fileSize`, `type`, and `uri`.
 * @param {DocumentPickerResponse} originalObject - The originalObject parameter is of type
 * DocumentPickerResponse.
 * @returns The function `mapObject` is returning an array of `Asset` objects.
 */
const mapObject = (originalObject: DocumentPickerResponse): Asset[] => {
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
    const result = await DocumentPicker.pick({
      type: [
        DocumentPicker.types.allFiles,
        DocumentPicker.types.images,
        DocumentPicker.types.plainText,
        DocumentPicker.types.audio,
        DocumentPicker.types.pdf,
        DocumentPicker.types.zip,
        DocumentPicker.types.csv,
        DocumentPicker.types.doc,
        DocumentPicker.types.docx,
        DocumentPicker.types.ppt,
        DocumentPicker.types.pptx,
        DocumentPicker.types.xls,
        DocumentPicker.types.xlsx,
      ], // You can specify the file types you want to allow
      presentationStyle: 'formSheet',
    });
    // TODO: Support multiple files
    const file = mapObject(result[0])[0];
    validateFileAndSetAttachments(dispatch, file);
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
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
  attachment: Asset | DocumentPickerResponse | Record<string, unknown>,
) => {
  const fileSize =
    'fileSize' in attachment
      ? (attachment.fileSize as number | undefined)
      : 'size' in attachment
        ? (attachment.size as number | undefined)
        : 0;
  if (findFileSize(fileSize ?? 0) <= MAXIMUM_FILE_UPLOAD_SIZE) {
    dispatch(updateAttachments([attachment as Asset]));
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
      entering={SlideInDown.springify().damping(38).stiffness(240)}
      exiting={SlideOutDown.springify().damping(38).stiffness(240)}
      style={tailwind.style('mx-1 pt-2 items-start', `h-[${containerHeight}px]`)}>
      {ADD_MENU_OPTIONS.map((menuOption, index) => {
        return <MenuOption key={menuOption.key} {...{ menuOption, index }} />;
      })}
    </Animated.View>
  );
};
