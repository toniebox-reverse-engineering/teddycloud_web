import React from "react";

interface FlagSVGProps {
    countryCode: string;
    height: number;
}

/* used flag svgs based on the ones from https://gitlab.com/catamphetamine/country-flag-icons by @catamphetamine <purecatamphetamine@gmail.com>
 * we might use that if there is an increase of available languages in the tonieverse directly instead adding languages one by one
 */

const LanguageFlagSVG: React.FC<FlagSVGProps> = ({ countryCode, height }) => {
    switch (countryCode) {
        case "de-de":
            return (
                <svg height={height} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
                    <path d="M0 0h100v20H0z" />
                    <path fill="#D00" d="M0 20h100v20H0z" />
                    <path fill="#FFCE00" d="M0 40h100v20H0z" />
                </svg>
            );
        case "en-gb":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.666" height={height}>
                    <g fill="#FFF">
                        <path d="M0 0h100v66.53H0z" />
                        <path d="M60.76 44.834 100 66.53v-6.141L71.988 44.834zM39.045 21.696 0 0v6.141l28.012 15.556z" />
                    </g>
                    <path
                        d="M76.764 44.834 100 57.642V44.834zm-16.004 0L100 66.53v-6.141L71.988 44.834zM89.396 66.53 60.741 50.604V66.53zM17.602 44.834 0 54.62v-9.786zm21.442 2.768V66.55H4.971zM23.041 21.696 0 8.889v12.807zm16.004 0L0 0v6.141l28.012 15.556zM10.409 0l28.655 15.926V0zm71.793 21.696L100 11.911v9.786zM60.76 18.928V0h34.093z"
                        fill="#0052B4"
                    />
                    <g fill="#D80027">
                        <path d="M56.141 0H43.665v27.037H0v12.476h43.664V66.55H56.14V39.513h43.664V27.037H56.14z" />
                        <path d="M60.76 44.834 100 66.53v-6.141L71.988 44.834zm-32.748 0L0 60.41v6.14l39.045-21.715zm11.033-23.139L0 0v6.141l28.012 15.556zm32.748 0L100 6.141V0L60.76 21.696z" />
                    </g>
                </svg>
            );
        case "en-us":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.667" height={height}>
                    <path fill="#FFF" d="M0 0h100v66.667H0z" />
                    <path
                        d="M0 0h100v5.127H0zm0 10.253h100v5.127H0zm0 10.253h100v5.127H0zm0 10.253h100v5.127H0zm0 10.273h100v5.127H0zm0 10.253h100v5.127H0zm0 10.253h100v5.129H0z"
                        fill="#D80027"
                    />
                    <path fill="#2E52B2" d="M0 0h50v35.887H0z" />
                    <path
                        d="m9.318 27.076-.78-2.495-.858 2.495H5.107l2.086 1.501-.78 2.495 2.125-1.54 2.066 1.54-.799-2.495 2.125-1.501zm10.975 0-.799-2.495-.819 2.495h-2.574l2.086 1.501-.78 2.495 2.086-1.54 2.105 1.54-.78-2.495 2.086-1.501zm11.014 0-.838-2.495-.78 2.495h-2.632l2.144 1.501-.819 2.495 2.086-1.54 2.144 1.54-.819-2.495 2.086-1.501zm10.955 0-.78-2.495-.819 2.495H38.07l2.105 1.501-.78 2.495 2.086-1.54 2.105 1.54-.838-2.495 2.144-1.501zM19.493 14.678l-.819 2.495h-2.573l2.086 1.54-.78 2.456 2.086-1.52 2.105 1.52-.78-2.456 2.086-1.54h-2.612zm-10.955 0-.858 2.495H5.107l2.086 1.54-.78 2.456 2.125-1.52 2.066 1.52-.799-2.456 2.125-1.54H9.318zm21.93 0-.78 2.495h-2.632l2.144 1.54-.819 2.456 2.086-1.52 2.144 1.52-.819-2.456 2.086-1.54h-2.573zm11.014 0-.819 2.495H38.07l2.105 1.54-.78 2.456 2.086-1.52 2.105 1.52-.838-2.456 2.144-1.54H42.26zM8.539 4.814 7.681 7.27H5.107l2.086 1.54-.78 2.476 2.125-1.539 2.066 1.54-.799-2.476 2.125-1.54H9.318zm10.955 0-.819 2.456h-2.574l2.086 1.54-.78 2.476 2.086-1.539 2.105 1.54-.78-2.476 2.086-1.54h-2.612zm10.975 0-.78 2.456h-2.632l2.144 1.54-.819 2.476 2.086-1.54 2.144 1.54-.819-2.476 2.086-1.54h-2.573zm11.014 0-.819 2.456h-2.593l2.105 1.54-.78 2.476 2.086-1.54 2.105 1.54-.838-2.476 2.144-1.54h-2.632z"
                        fill="#FFF"
                    />
                </svg>
            );
        case "fr-fr":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.667" height={height}>
                    <path fill="#FFF" d="M0 0h100v66.667H0z" />
                    <path fill="#0052B4" d="M0 0h33.333v66.667H0z" />
                    <path fill="#D80027" d="M66.667 0H100v66.667H66.667z" />
                </svg>
            );
        case "nl-be":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.667" height={height}>
                    <path fill="#fdda25" d="M0 0h100v66.667H0z" />
                    <path d="M0 0h33.333v66.667H0z" />
                    <path fill="#ef3340" d="M66.667 0H100v66.667H66.667z" />
                </svg>
            );
        case "nl-nl":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.667" height={height}>
                    <path fill="#FFF" d="M0 22.222h100v22.222H0z" />
                    <path fill="#cd1f2a" d="M0 0h100v22.222H0z" />
                    <path fill="#1d4185" d="M0 44.444h100v22.223H0z" />
                </svg>
            );
        case "pt-pt":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 16.667 100 66.667" height={height}>
                    <path y="85.337" fill="#D80027" width="512" height="341.326" d="M0 16.667H100V83.333H0V16.667z" />
                    <path
                        fill="#6DA544"
                        points="196.641,85.337 196.641,261.565 196.641,426.663 0,426.663 0,85.337 "
                        d="M38.406 16.667L38.406 51.087L38.406 83.333L0 83.333L0 16.667Z"
                    />
                    <path
                        fill="#FFDA44"
                        cx="196.641"
                        cy="256"
                        r="64"
                        d="M50.906 50A12.5 12.5 0 0 1 38.406 62.5A12.5 12.5 0 0 1 25.906 50A12.5 12.5 0 0 1 50.906 50z"
                    />
                    <path
                        fill="#D80027"
                        d="M31.375 43.75v7.813c0 3.883 3.148 7.031 7.031 7.031s7.031 -3.148 7.031 -7.031V43.75z"
                    />
                    <path
                        fill="#FFFFFF"
                        d="M38.406 53.906c-1.292 0 -2.344 -1.051 -2.344 -2.344v-3.125h4.688v3.125c0 1.292 -1.052 2.344 -2.344 2.344"
                    />
                </svg>
            );
        case "it-it":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.667" height={height}>
                    <path fill="#FFF" d="M66.667 0H0v66.53h99.805V0Z" />
                    <path fill="#6DA544" d="M0 0h33.333v66.667H0z" />
                    <path fill="#D80027" d="M66.667 0H100v66.667H66.667z" />
                </svg>
            );
        case "es-es":
            return (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 66.667" height={height}>
                    <path fill="#FFFFFF" d="M0 0h100v66.667H0z" />
                    <path fill="#D03433" d="M0 0h100v17.778H0zm0 48.889h100v17.778H0z" />
                    <path fill="#FBCA46" d="M0 17.778h100v31.111H0z" />
                    <path fill="#FFFFFF" d="M34.667 31.111h4.444v2.222h-4.444z" />
                    <path
                        fill="#A41517"
                        d="M32 37.778c0 1.333 1.333 2.222 2.667 2.222s2.667 -0.889 2.667 -2.222L37.778 31.111H31.556zM29.333 31.111c0 -1.333 0.889 -2.222 1.778 -2.222h6.667c1.333 0 2.222 0.889 2.222 1.778V31.111l-0.444 6.667c-0.444 2.667 -2.222 4.444 -4.889 4.444s-4.444 -1.778 -4.889 -4.444z"
                    />
                    <path
                        fill="#A41517"
                        d="M30.222 33.333h8.889V35.556h-2.222l-2.222 4.444 -2.222 -4.444h-2.222zM23.556 26.667h4.444v15.556h-4.444zm17.778 0h4.444v15.556h-4.444zm-11.111 -2.222c0 -1.333 0.889 -2.222 2.222 -2.222h4.444c1.333 0 2.222 0.889 2.222 2.222v0.889q0 1.333 -1.333 1.333H31.111c-0.444 0 -0.889 -0.444 -0.889 -0.889z"
                    />
                </svg>
            );
        case "pl-pl":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 16.667 100 66.667" height={height}>
                    <g>
                        <path
                            y="85.337"
                            fill="#FFFFFF"
                            width="512"
                            height="341.326"
                            d="M0 16.667H100V83.333H0V16.667z"
                        />
                        <path y="85.337" fill="#FFFFFF" width="512" height="170.663" d="M0 16.667H100V50H0V16.667z" />
                    </g>
                    <path y="256" fill="#D80027" width="512" height="170.663" d="M0 50H100V83.333H0V50z" />
                </svg>
            );
        case "tr-tr":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 -5000 15000 10000">
                    <path fill="#E30A17" d="M0-5000h15000V5000H0z" />
                    <path
                        fill="#FFFFFF"
                        d="m6958.333 0 2261.333-734.667-1397.667 1923.5v-2377.666l1397.667 1923.5zM7112.5 1336.833a2500 2500 0 1 1 0-2673.667 2000 2000 0 1 0 0 2673.667"
                    />
                </svg>
            );
        default:
            return null; // Return null for unsupported country codes
    }
};

export default LanguageFlagSVG;

export const languageOptions: string[] = [
    "de-de",
    "en-gb",
    "en-us",
    "es-es",
    "fr-fr",
    "it-it",
    "nl-be",
    "nl-nl",
    "pl-pl",
    "pt-pt",
    "tr-tr",
    "undefined",
];
