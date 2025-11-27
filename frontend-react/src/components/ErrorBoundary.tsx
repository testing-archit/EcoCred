import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    padding: '20px', 
                    fontFamily: 'monospace',
                    maxWidth: '800px',
                    margin: '50px auto',
                    background: '#fee',
                    border: '2px solid #f00',
                    borderRadius: '8px'
                }}>
                    <h1 style={{ color: '#c00' }}>🚨 Application Error</h1>
                    <p>The application encountered an error. Check the details below:</p>
                    <details style={{ marginTop: '20px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            Error Details
                        </summary>
                        <pre style={{ 
                            background: '#fff', 
                            padding: '10px', 
                            overflow: 'auto',
                            marginTop: '10px'
                        }}>
                            <strong>Error:</strong> {this.state.error?.toString()}
                            {'\n\n'}
                            <strong>Stack:</strong>
                            {'\n'}
                            {this.state.error?.stack}
                            {'\n\n'}
                            {this.state.errorInfo && (
                                <>
                                    <strong>Component Stack:</strong>
                                    {'\n'}
                                    {this.state.errorInfo.componentStack}
                                </>
                            )}
                        </pre>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

