import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Video, Mic, MicOff, VideoOff, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  message_type: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface CourseChatProps {
  skillListingId: string;
  isInstructor: boolean;
}

export const CourseChatFixed = ({ skillListingId, isInstructor }: CourseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Debug Supabase connection
  useEffect(() => {
    const debugConnection = async () => {
      try {
        console.log('🔧 Debugging Supabase connection...');
        
        // Test basic connection
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('👤 Current user:', user?.id || 'Not authenticated');
        
        if (authError) {
          console.error('❌ Auth error:', authError);
          setError('Authentication error: ' + authError.message);
          return;
        }

        // Test database connection
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (testError) {
          console.error('❌ Database error:', testError);
          setError('Database connection error: ' + testError.message);
          return;
        }
        
        console.log('✅ Supabase connection successful');
        setError(null);
        
      } catch (err: any) {
        console.error('❌ Connection test failed:', err);
        setError('Connection test failed: ' + err.message);
      }
    };

    debugConnection();
  }, []);

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
    
    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [skillListingId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📨 Fetching messages for skill listing:', skillListingId);
      
      // Ensure chat room exists
      const { data: room, error: roomError } = await supabase
        .from('course_chat_rooms')
        .select('id')
        .eq('skill_listing_id', skillListingId)
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        console.error('❌ Room error:', roomError);
        throw roomError;
      }

      let roomId = room?.id;
      
      // Create room if it doesn't exist
      if (!roomId) {
        console.log('🏠 Creating chat room for skill listing:', skillListingId);
        const { data: newRoom, error: createError } = await supabase
          .from('course_chat_rooms')
          .insert({ skill_listing_id: skillListingId })
          .select('id')
          .single();
          
        if (createError) {
          console.error('❌ Create room error:', createError);
          throw createError;
        }
        
        roomId = newRoom.id;
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message,
          message_type,
          created_at,
          profiles:profiles!chat_messages_sender_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Messages error:', messagesError);
        throw messagesError;
      }

      console.log('✅ Fetched', messagesData?.length || 0, 'messages');
      setMessages(messagesData || []);
      
    } catch (err: any) {
      console.error('❌ Fetch messages error:', err);
      setError(err.message || 'Failed to fetch messages');
      toast({
        title: "Fetch Failed",
        description: err.message || "Failed to fetch messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('🔌 Setting up real-time subscription...');
    
    const channel = supabase
      .channel(`chat-${skillListingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=in.(${skillListingId})`
        },
        (payload) => {
          console.log('📨 New message received:', payload);
          fetchMessages(); // Refetch to get the new message with profile data
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          setError('Real-time connection failed');
        }
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      
      console.log('📤 Sending message:', newMessage.trim());
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Get or create room
      let { data: room, error: roomError } = await supabase
        .from('course_chat_rooms')
        .select('id')
        .eq('skill_listing_id', skillListingId)
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError;
      }

      if (!room) {
        console.log('🏠 Creating chat room...');
        const { data: newRoom, error: createError } = await supabase
          .from('course_chat_rooms')
          .insert({ skill_listing_id: skillListingId })
          .select('id')
          .single();
          
        if (createError) {
          throw createError;
        }
        
        room = newRoom;
      }

      // Send message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          sender_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (messageError) {
        console.error('❌ Send message error:', messageError);
        throw messageError;
      }

      console.log('✅ Message sent successfully');
      setNewMessage("");
      
    } catch (err: any) {
      console.error('❌ Send message error:', err);
      setError(err.message || 'Failed to send message');
      toast({
        title: "Send Failed",
        description: err.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      toast({
        title: "Video Call Failed",
        description: "Could not access camera/microphone",
        variant: "destructive"
      });
    }
  };

  const endVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading chat...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Chat Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchMessages} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <span>Course Chat</span>
          {isInstructor && (
            <Badge variant="secondary" className="text-xs">
              Instructor
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Call Controls */}
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Video Call</span>
            {isVideoEnabled && (
              <Badge variant="success" className="text-xs">
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isVideoEnabled ? (
              <Button onClick={startVideoCall} size="sm" variant="outline">
                <Video className="h-4 w-4 mr-2" />
                Start Call
              </Button>
            ) : (
              <>
                <Button onClick={toggleVideo} size="sm" variant={isVideoEnabled ? "default" : "outline"}>
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button onClick={toggleAudio} size="sm" variant={isAudioEnabled ? "default" : "outline"}>
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button onClick={endVideoCall} size="sm" variant="destructive">
                  End Call
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Video Display */}
        {isVideoEnabled && localStream && (
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-48 object-cover rounded-lg bg-muted"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              You
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 p-4 bg-muted/10 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-foreground text-xs">
                    {message.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">
                      {message.profiles?.full_name || message.profiles?.username || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">{message.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="animate-pulse-glow"
          >
            {sending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
