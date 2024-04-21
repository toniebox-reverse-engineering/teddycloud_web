import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, message } from 'antd';
import type { SelectProps } from 'antd';

    /* mocking box images - should be done earlier, currently on every action the image is changed */
    const boxModelImages = [
      { id: 'Green', img_src: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/Toniebox_green_d-wbQxOcva.png' },
      { id: 'Light Blue', img_src: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/Toniebox_light_blue_-pWNBQTmB.png'},
      { id: 'Red', img_src: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/Toniebox_red_d-DrP5n54q.png'},
      { id: 'Pink', img_src: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/03-0014-b-O1vs1-O6.png'},
      { id: 'Purple', img_src: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/Toniebox_purple_d-hcV9uyl-.png'},
      { id: 'Grey', img_src: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/Toniebox_grey_d-0hENHTGx.png'},
      { id: 'Disney 100', img_src: 'https://cdn.idealo.com/folder/Product/202973/8/202973830/s1_produktbild_max_1/tonies-toniebox-starterset-disney-100-fantasia-limited-edition.jpg'},
    ];


export const TonieboxModelSearch: React.FC<{ placeholder: string; style: React.CSSProperties; onChange: (newValue: string) => void }> = (props) => {
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
            style={props.style}
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