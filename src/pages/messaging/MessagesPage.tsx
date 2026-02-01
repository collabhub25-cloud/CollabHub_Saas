import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { SearchInput } from '@/components/shared/SearchInput';
import { EmptyState } from '@/components/shared/EmptyState';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  ArrowLeft,
  Check,
  CheckCheck,
  Search
} from 'lucide-react';
import { mockConversations, mockMessages } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';

export function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const conversations = mockConversations;
  
  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = conv.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherUser = selectedConv?.participants.find(p => p.id !== user?.id);
  const conversationMessages = mockMessages.filter(m => m.conversationId === selectedConversation);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput('');
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <AnimatedContainer variant="slide-up" className="h-full">
        <Card className="h-full overflow-hidden">
          <div className="grid lg:grid-cols-[320px_1fr] h-full">
            {/* Conversations List */}
            <div className={`border-r flex flex-col ${selectedConversation ? 'hidden lg:flex' : ''}`}>
              <div className="p-4 border-b">
                <h1 className="text-xl font-bold mb-4">Messages</h1>
                <SearchInput
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
              
              <ScrollArea className="flex-1">
                {filteredConversations.length > 0 ? (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => {
                      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
                      if (!otherParticipant) return null;

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`w-full flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors text-left ${
                            selectedConversation === conversation.id ? 'bg-accent' : ''
                          }`}
                        >
                          <UserAvatar user={otherParticipant} showStatus />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{otherParticipant.name}</span>
                              {conversation.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className={`text-sm truncate ${
                                conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                              }`}>
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="flex-shrink-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Search}
                    title="No conversations"
                    description="Start a conversation with someone to see it here."
                    className="py-8"
                  />
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex flex-col ${!selectedConversation ? 'hidden lg:flex' : ''}`}>
              {selectedConversation && otherUser ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-4 p-4 border-b">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <UserAvatar user={otherUser} showStatus />
                    <div className="flex-1">
                      <h2 className="font-semibold">{otherUser.name}</h2>
                      <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {conversationMessages.map((message) => {
                        const isMe = message.senderId === user?.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isMe
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              }`}
                            >
                              <p>{message.content}</p>
                              <div className={`flex items-center gap-1 mt-1 text-xs ${
                                isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                <span>{formatRelativeTime(message.createdAt)}</span>
                                {isMe && (
                                  message.isRead ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Send className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Select a conversation from the list to start chatting, or reach out to someone new.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link to="/discover/startups">Find People</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </AnimatedContainer>
    </div>
  );
}
