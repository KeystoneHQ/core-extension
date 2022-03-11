import { MutableRefObject, PropsWithChildren } from 'react';
import styled from 'styled-components';

const BOTTOM_PADDING = 16;

// Dropdown is absolutely positioned, and fills the viewport beneath the select element
const getDropdownHeight = (
  anchorEl: MutableRefObject<HTMLElement | null>
): number => {
  if (!anchorEl.current) return 0; // Default height
  return (
    window.visualViewport.height -
    anchorEl?.current?.getBoundingClientRect().top -
    anchorEl?.current?.offsetHeight -
    BOTTOM_PADDING
  );
};

const getOffsetTop = (anchorEl: MutableRefObject<HTMLElement | null>) =>
  anchorEl?.current
    ? anchorEl?.current?.offsetTop + anchorEl?.current?.offsetHeight
    : 0;

const Dropdown = styled.div<{ isOpen: boolean; height: number; top: number }>`
  display: flex;
  flex-flow: column;
  position: absolute;
  overflow-y: hidden;
  width: 100%;
  background: ${({ theme }) => theme.colors.bg1};
  z-index: 1;
  transition: height 0.15s ease, opacity 0.15s ease;
  borderradius: 0 0 8px 8px;
  height: ${({ isOpen, height }) => (isOpen ? `${height}px` : 0)};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  top: ${({ top }) => `${top}px`};
  transition: height 0.15s ease, opacity 0.15s ease;
`;

type ContainedDropdownProps = {
  anchorEl: MutableRefObject<HTMLElement | null>;
  isOpen?: boolean;
};

/**
 * Wrapper for dropdown content on the browser-extension wallet.
 * Provides a full-width container spanning the space beneath the anchorEl, within the viewport.
 */
export const ContainedDropdown = ({
  anchorEl, // Ref of the element above where the dropdown should appear
  children,
  isOpen = false,
}: PropsWithChildren<ContainedDropdownProps>) => {
  const height = getDropdownHeight(anchorEl);
  const top = getOffsetTop(anchorEl);
  return (
    <Dropdown height={height} isOpen={isOpen} top={top}>
      {children}
    </Dropdown>
  );
};