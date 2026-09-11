import { createContext, useContext } from 'react';

export const InstructorPortalContext = createContext({
  currentInstructor: null,
  isViewingAsAdmin: false,
  baseRoute: '/instructor',
  returnToAdmin: () => {},
  isLoading: false,
  error: null,
  refreshInstructor: () => {},
});

export const useInstructorPortal = () => {
  return useContext(InstructorPortalContext);
};
