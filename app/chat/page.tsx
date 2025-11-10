"use client";
import { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon, Database } from 'lucide-react';
import { tr } from 'date-fns/locale';

export default function VannaChat() {
  const [isLoading, setIsLoading] = useState(true);
  const vannaRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Load the web component script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://img.vanna.ai/vanna-components.js';
    script.onload = () => setIsLoading(false);
    document.head.appendChild(script);

    // Add custom styles for Vanna AI component
    const style = document.createElement('style');
   

    document.head.appendChild(style);
  }, []);

  return (
    <div className=" bg-white ">
      <div className="p-1 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between   mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl p-2 font-bold text-gray-900">
              Chat with Your Data
            </h1>
            
          </div>
        </div>

        {/* Main Content */}
        <div className=" w-3/4 p-2">
          {/* Sidebar */}


          {/* Chat Area */}
          <Card className="bg-white border-none p-3">
            {isLoading ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              
              //<div className='bg-black' style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
              <vanna-chat
                ref={vannaRef}
                api-base={process.env.NEXT_PUBLIC_VANNA_API_URL}
                sse-endpoint={`${process.env.NEXT_PUBLIC_VANNA_API_URL}/api/vanna/v2/chat_sse`}
                ws-endpoint={`${process.env.NEXT_PUBLIC_VANNA_API_URL}/api/vanna/v2/chat_websocket`}
                poll-endpoint={`${process.env.NEXT_PUBLIC_VANNA_API_URL}/api/vanna/v2/chat_poll`}
                style={{ width: '98%', height: '100%', display: 'block' }}
                theme="light"
                fullscreen={true}
                class="  h-[600px] block rounded-lg overflow-hidden theme-light "
              />
              //</div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}