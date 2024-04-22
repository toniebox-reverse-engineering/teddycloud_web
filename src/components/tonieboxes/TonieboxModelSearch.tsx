import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, message } from 'antd';
import type { SelectProps } from 'antd';

/* mocking box images - should be done earlier, currently on every action the image is changed */
const boxModelImages = [
  { id: 'Green', img_src: 'https://cdn.tonies.de/thumbnails/03-0013-i.png' },
  { id: 'Light Blue', img_src: 'https://cdn.tonies.de/thumbnails/03-0012-i.png'},
  { id: 'Red', img_src: 'https://cdn.tonies.de/thumbnails/03-0011-i.png'},
  { id: 'Pink', img_src: 'https://cdn.tonies.de/thumbnails/03-0014-i.png'},
  { id: 'Purple', img_src: 'https://cdn.tonies.de/thumbnails/03-0010-i.png'},
  { id: 'Grey', img_src: 'https://cdn.tonies.de/thumbnails/03-0009-i.png'},
  { id: 'Red - Disney 100 Limited Edition', img_src: 'https://www.babyone.at/media/1e/e1/b0/1687489451/58525690_shop3.png'},
  { id: 'Dark Grey - Unter meinem Bett Limited Edition', img_src: 'https://cdn.tonies.de/thumbnails/03-0005-i.png'},
  { id: 'Black - 3 Fragezeichen Limited Edition', img_src: 'https://www.galaxus.ch/im/Files/3/8/3/5/4/8/6/0/10000490-50001308-sRGB-b.png'},
  { id: 'Turquoise - Limited Edition', img_src: 'https://cdn.tonies.de/thumbnails/03-0008-i.png'},
  { id: 'Yellow - Limited Edition', img_src: 'https://www.german-toys.com/media/image/7d/91/3c/toniebox-gelbpMXs4tGJTygY7.jpg'},
  { id: 'Dark Blue - Limited Edition', img_src: 'https://www.german-toys.com/media/image/ce/57/ab/dunkelblaue-Toniebox.jpg'},
];

export const TonieboxModelSearch: React.FC<{ placeholder: string; onChange: (newValue: string) => void }> = (props) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [value, setValue] = useState<string>();

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange(newValue);
    };

    return (
        <Select
            showSearch
            value={value}
            placeholder={props.placeholder}
            defaultActiveFirstOption={false}
            suffixIcon={null}
            filterOption={false}
            onChange={handleChange}
            notFoundContent={null}
            options={(boxModelImages || []).map((d) => ({
                value: d.img_src,
                label: d.id,
            }))}
        />
    );
};