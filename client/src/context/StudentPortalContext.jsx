import { createContext, useContext } from 'react';

export const StudentPortalContext = createContext({
  currentStudent: null,
  isViewingAsAdmin: false,
  baseRoute: '/student',
  returnToAdmin: () => {},
  isLoading: false,
  error: null,
  refreshStudent: () => {},
});

export const useStudentPortal = () => {
  return useContext(StudentPortalContext);
};
