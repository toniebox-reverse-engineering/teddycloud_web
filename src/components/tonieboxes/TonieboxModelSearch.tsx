import React, { useState } from 'react';
import { Select } from 'antd';

/* mocking box images - should be done earlier, currently on every action the image is changed */
const boxModelImages = [
    { id: '03-0013', name:'Green', img_src: 'https://cdn.tonies.de/thumbnails/03-0013-i.png' },
    { id: '03-0012', name:'Light Blue', img_src: 'https://cdn.tonies.de/thumbnails/03-0012-i.png' },
    { id: '03-0011', name:'Red', img_src: 'https://cdn.tonies.de/thumbnails/03-0011-i.png' },
    { id: '03-0014', name:'Pink', img_src: 'https://cdn.tonies.de/thumbnails/03-0014-i.png' },
    { id: '03-0010', name:'Purple', img_src: 'https://cdn.tonies.de/thumbnails/03-0010-i.png' },
    { id: '03-0009', name:'Grey', img_src: 'https://cdn.tonies.de/thumbnails/03-0009-i.png' },
    { id: '99-0100', name:'Red - Disney 100 Limited Edition', img_src: 'https://www.babyone.at/media/1e/e1/b0/1687489451/58525690_shop3.png' },
    { id: '03-0005', name:'Dark Grey - Unter meinem Bett Limited Edition', img_src: 'https://cdn.tonies.de/thumbnails/03-0005-i.png' },
    { id: '99-0003', name:'Black - 3 Fragezeichen Limited Edition', img_src: 'https://www.galaxus.ch/im/Files/3/8/3/5/4/8/6/0/10000490-50001308-sRGB-b.png' },
    { id: '03-0008', name:'Turquoise - Limited Edition', img_src: 'https://cdn.tonies.de/thumbnails/03-0008-i.png' },
    { id: '99-0002', name:'Gulli - Limited Edition', img_src: 'https://i.ebayimg.com/images/g/lHIAAOSwyLtjiQGt/s-l1600.jpg' },
];

export const TonieboxModelSearch: React.FC<{ placeholder: string; onChange: (newValue: string) => void }> = (props) => {

    const [value, setValue] = useState<string>();

    const handleChange = (newValue: string) => {
        setValue(newValue);
        const selectedModel = boxModelImages.find(item => item.id === newValue);
        if (selectedModel) {
            props.onChange(selectedModel.id);
        }
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
                value: d.id,
                label: d.name,
            }))}
        />
    );
};
