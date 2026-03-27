import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import colors from '../theme/colors';

const KarnatakaMapIcon = ({ saved = false, width = 30, height = 30 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 30 30">
      <Path
        d="M15 3C9 3 3.5 8 5.5 13.5C7.5 19 15 27 15 27C15 27 22.5 19 24.5 13.5C26.5 8 21 3 15 3Z"
        fill={saved ? colors.red : 'none'}
        stroke={colors.red}
        strokeWidth="2"
      />
      {saved && (
        <Circle cx="15" cy="12" r="3" fill={colors.yellow} />
      )}
    </Svg>
  );
};

export default KarnatakaMapIcon;
