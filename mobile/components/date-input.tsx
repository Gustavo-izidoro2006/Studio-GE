import { TextInput, type StyleProp, type TextStyle } from 'react-native';

import { formatarEntradaData } from '@/utils/date';

type DateInputProps = {
  accessibilityLabel: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<TextStyle>;
  value: string;
};

export function DateInput({ accessibilityLabel, onChangeText, style, value }: DateInputProps) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      keyboardType="number-pad"
      maxLength={10}
      onChangeText={(text) => onChangeText(formatarEntradaData(text, value))}
      placeholder="DD/MM/AAAA"
      placeholderTextColor="#9AA4AD"
      style={style}
      value={value}
    />
  );
}
