import { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 items-center justify-center p-8">
            <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
              <Text className="text-4xl">⚠️</Text>
            </View>
            <Text className="text-2xl font-extrabold text-text text-center mb-3 tracking-tighter">
              Something Went Wrong
            </Text>
            <Text className="text-base text-text-muted text-center mb-8 leading-6">
              An unexpected error occurred. Our team has been automatically notified via Sentry.
            </Text>
            <Button
              title="Try Again"
              onPress={this.handleRetry}
              variant="primary"
              className="min-w-[160px]"
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
