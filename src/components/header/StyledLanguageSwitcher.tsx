import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { changeLanguage } from "i18next";

const StyledWrapper = styled.div`
  > span {
    margin-left: 8px;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const StyledLanguageSwitcher = () => {
  return (
    <StyledWrapper>
      <span onClick={() => changeLanguage("en")}>EN</span>
      <span onClick={() => changeLanguage("de")}>DE</span>
    </StyledWrapper>
  );
};
