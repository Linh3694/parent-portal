import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';

function getFontFamily(style?: StyleProp<TextStyle>) {
    let fontWeight: string = 'normal';
    let fontStyle: string = 'normal';

    if (Array.isArray(style)) {
        style.forEach(s => {
            if (s && typeof s === 'object' && !Array.isArray(s)) {
                if ('fontWeight' in s && s.fontWeight) fontWeight = String(s.fontWeight);
                if ('fontStyle' in s && s.fontStyle) fontStyle = String(s.fontStyle);
            }
        });
    } else if (style && typeof style === 'object' && !Array.isArray(style)) {
        if ('fontWeight' in style && style.fontWeight) fontWeight = String(style.fontWeight);
        if ('fontStyle' in style && style.fontStyle) fontStyle = String(style.fontStyle);
    }

    if ((fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') && fontStyle === 'italic') {
        return 'Mulish-BoldItalic';
    }
    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
        return 'Mulish-Bold';
    }
    if (fontStyle === 'italic') {
        return 'Mulish-Italic';
    }
    return 'Mulish-Regular';
}

export default function AppText(props: TextProps) {
    const fontFamily = getFontFamily(props.style);
    return <Text {...props} style={[{ fontFamily }, props.style]} />;
}
