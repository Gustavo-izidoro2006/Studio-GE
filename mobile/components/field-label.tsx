import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
  required?: boolean;
};

// Rótulo de campo de formulário. Só campos obrigatórios recebem "(obrigatório)".
export function FieldLabel({ children, style, required = false }: Props) {
  return (
    <Text style={style}>
      {children}
      {required ? <Text style={styles.required}> (obrigatório)</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  required: {
    color: '#5F6B76',
    fontSize: 12,
    fontWeight: '400',
  },
});
