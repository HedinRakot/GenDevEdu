import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import '@/i18n';

const mockCreate = jest.fn();
jest.mock('@/hooks/useCourses', () => ({
  useCreateCourse: () => ({ mutate: mockCreate, isPending: false }),
}));

const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: mockReplace, goBack: jest.fn(), navigate: jest.fn() }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { CreateCourseScreen } from '@/screens/author/CreateCourseScreen';

function renderScreen() {
  return render(
    <ThemeProvider>
      <CreateCourseScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('CreateCourseScreen', () => {
  it('blocks creation and warns when the name is empty', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Erstellen'));

    expect(alertSpy).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a course and navigates to the editor on success', () => {
    mockCreate.mockImplementation((_payload, opts) => opts.onSuccess({ elementId: 'new-course' }));
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText(/csharp-basics/i), 'csharp-basics');
    fireEvent.press(getByText('Erstellen'));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'csharp-basics' }),
      expect.any(Object),
    );
    expect(mockReplace).toHaveBeenCalledWith(
      'CourseEditor',
      expect.objectContaining({ courseId: 'new-course' }),
    );
  });
});
