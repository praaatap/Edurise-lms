import { useAIStore } from './aiStore';

describe('AI Store', () => {
  beforeEach(() => {
    useAIStore.setState({
      messages: [],
      isTyping: false,
    });
  });

  it('should add a message', () => {
    const id = useAIStore.getState().addMessage({ text: 'Hello', sender: 'user' });
    const messages = useAIStore.getState().messages;
    
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe(id);
    expect(messages[0].text).toBe('Hello');
  });

  it('should append message chunks', () => {
    const id = useAIStore.getState().addMessage({ text: 'Hello', sender: 'ai' });
    useAIStore.getState().appendMessageChunk(id, ' World');
    
    expect(useAIStore.getState().messages[0].text).toBe('Hello World');
  });

  it('should set typing status', () => {
    useAIStore.getState().setTyping(true);
    expect(useAIStore.getState().isTyping).toBe(true);
  });

  it('should clear messages', () => {
    useAIStore.getState().addMessage({ text: 'Test', sender: 'user' });
    useAIStore.getState().clearMessages();
    
    expect(useAIStore.getState().messages).toHaveLength(1);
    expect(useAIStore.getState().messages[0].text).toContain("start fresh");
  });
});
