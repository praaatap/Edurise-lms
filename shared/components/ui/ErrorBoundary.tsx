import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import * as Sentry from '@sentry/react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 🔴 ENHANCED ERROR LOGGING
    console.error('\n\n🚨 ============ RENDER ERROR ============ 🚨');
    console.error('ERROR MESSAGE:', error.message);
    console.error('COMPONENT STACK:', info.componentStack);
    console.error('FULL STACK TRACE:', error.stack);
    console.error('🚨 ======================================== 🚨\n\n');

    // Report to Sentry in production
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <ScrollView contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <AlertTriangle size={40} color={Colors.error} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 }}>
              Something went wrong
            </Text>
            <Text style={{ fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
              The app ran into an unexpected error. This has been reported and we'll look into it.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, width: '100%', marginBottom: 24 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 11, color: Colors.error, lineHeight: 18 }}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={this.handleReset}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: Colors.primary,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <RefreshCw size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
