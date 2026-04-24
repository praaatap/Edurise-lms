import CourseContentScreen from '@/app/course/[id]/content';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

// Mock dependencies
jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn().mockReturnValue({ id: 'test-course-1' }),
    useRouter: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
    const { View } = require('react-native');
    return { SafeAreaView: View };
});

jest.mock('react-native-webview', () => {
    const { View } = require('react-native');
    // Mock WebView as a simple view to prevent rendering actual web content in Node
    return { WebView: View };
});

jest.mock('@/shared/components/ui/OfflineBanner', () => {
    const { View } = require('react-native');
    return { OfflineBanner: () => <View testID="offline-banner" /> };
});

jest.mock('@/features/courses/utils/courseHtml', () => ({
    generateCourseHtml: jest.fn().mockReturnValue('<html>Mocked Course</html>'),
}));

jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return { Ionicons: () => <Text>Icon</Text> };
});

describe('CourseContentScreen', () => {
    const mockBack = jest.fn();
    const mockCompleteCourse = jest.fn();
    const mockUpdateQuizScore = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({ back: mockBack });

        // Mock Zustand Auth Store
        useAuthStore.setState({ token: 'mock-token', user: { id: 'u1' } as any });

        // Mock Zustand Course Store
        useCourseStore.setState({
            courses: [{
                id: 'test-course-1',
                title: 'Mastering React Native Expo',
                description: 'Test description',
            } as any],
            getCourseById: jest.fn().mockReturnValue({
                id: 'test-course-1',
                title: 'Mastering React Native Expo',
            }),
            completeCourse: mockCompleteCourse,
            updateQuizScore: mockUpdateQuizScore,
        } as any);
    });

    it('should render nothing if course is not found', () => {
        useCourseStore.setState({ getCourseById: jest.fn().mockReturnValue(undefined) } as any);

        const { toJSON } = render(<CourseContentScreen />);
        expect(toJSON()).toBeNull();
    });

    it('should render course title in the header', () => {
        const { getByText } = render(<CourseContentScreen />);

        expect(getByText('Mastering React Native Expo')).toBeTruthy();
    });

    it('should trigger router.back() when close button is pressed', () => {
        const { getAllByText } = render(<CourseContentScreen />);

        // Assuming the first Icon rendered is the Close button in the header
        const closeButtons = getAllByText('Icon');
        fireEvent.press(closeButtons[0]);

        expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('should display error screen when webview error occurs', () => {
        // We'll mock useState temporarily or simulate an error
        // An easier approach for functional components is forcing the condition
        const useStateSpy = jest.spyOn(React, 'useState');
        // Mock the state to simulate: [progress, isLoading, webViewError]
        useStateSpy
            .mockImplementationOnce(() => [0, jest.fn()]) // progress
            .mockImplementationOnce(() => [false, jest.fn()]) // isLoading
            .mockImplementationOnce(() => ['Connection dropped', jest.fn()]); // webViewError

        const { getByText } = render(<CourseContentScreen />);

        expect(getByText('Content Failed To Load')).toBeTruthy();
        expect(getByText('Connection dropped')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();

        // Cleanup spy
        useStateSpy.mockRestore();
    });
});