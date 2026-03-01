import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Animated, StatusBar, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon } from '@infrastructure/ui';
import { EMAIL_REGEX } from '@domain/constants';
import { KeyRoundIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { authActions } from '@application/store/auth/authActions';
import { useAppDispatch } from '@/hooks';
import { resetAuth } from '@application/store/auth/authSlice';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { ACCOUNT_EVENTS } from '@domain/constants/analyticsEvents';
import i18n from '@infrastructure/i18n';

type FormData = {
  email: string;
  password: string;
};

const ForgotPassword = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(resetAuth());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const { email } = data;
    dispatch(authActions.resetPassword({ email }));
    AnalyticsHelper.track(ACCOUNT_EVENTS.FORGOT_PASSWORD);
  };

  return (
    <SafeAreaView style={tailwind.style('flex-1 bg-solid-1')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-solid-1')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('flex-1 bg-solid-1')}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tailwind.style('px-6 pt-16')}>
          <Icon icon={<KeyRoundIcon />} size={40} />
          <View style={tailwind.style('pt-6 gap-4')}>
            <Animated.Text style={tailwind.style('text-2xl text-slate-12 font-inter-semibold-20')}>
              {i18n.t('FORGOT_PASSWORD.TITLE')}
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'font-inter-normal-20 leading-[18px] tracking-[0.32px] text-slate-12',
              )}>
              {i18n.t('FORGOT_PASSWORD.SUB_TITLE')}
            </Animated.Text>
          </View>

          <Controller
            control={control}
            rules={{
              required: i18n.t('LOGIN.EMAIL_REQUIRED'),
              pattern: {
                value: EMAIL_REGEX,
                message: i18n.t('LOGIN.EMAIL_ERROR'),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tailwind.style('pt-8 mb-8 gap-2')}>
                <Animated.Text style={tailwind.style('font-inter-420-20 text-slate-12')}>
                  {i18n.t('LOGIN.EMAIL')}
                </Animated.Text>
                <TextInput
                  style={[
                    tailwind.style(
                      'text-base font-inter-normal-20 tracking-[0.24px] leading-[20px] android:leading-[18px]',
                      'py-2 px-3 rounded-xl text-slate-12 bg-blackA-A4',
                      'h-10',
                    ),
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholderTextColor={tailwind.color('text-slate-12')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Animated.Text style={tailwind.style('text-ruby-11')}>
                    {errors.email.message}
                  </Animated.Text>
                )}
              </View>
            )}
            name="email"
          />

          <Button
            text={i18n.t('FORGOT_PASSWORD.RESET_HERE')}
            handlePress={handleSubmit(onSubmit)}
          />
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPassword;
