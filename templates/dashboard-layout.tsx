import React from 'react';
import { MotionContainer } from 'framer-motion';
import LeftSidebar from './left-sidebar';
import CentralCanvas from './central-central';
import RightSidebar from './right-sidebar';
import BottomPanel from './bottom-panel';
import FloatingChat from './floating-chat';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <MotionContainer>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19]">
        {/* Left Sidebar - Tools & Capabilities */}
        <LeftSidebar className="w-64 border-r border-[rgba(255,255,255,0.1)]" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Central Canvas - Visual Routing Map */}
          <CentralCanvas className="flex-1 border-b border-[rgba(255,255,255,0.1)] overflow-hidden relative" />
          
          {/* Bottom Panel - Telemetry Graphs & Chat Overlay */}
          <div className="flex h-[200px] border-t border-[rgba(255,255,255,0.1)] overflow-hidden relative">
            <BottomPanel className="flex-1 border-r border-[rgba(255,255,255,0.1)] overflow-y-auto" />
            <FloatingChat className="flex-1" />
          </div>
        </div>
        
        {/* Right Sidebar - Security Metrics & Network Isolation */}
        <RightSidebar className="w-80 border-l border-[rgba(255,255,255,0.1)]" />
      </div>
      
      {children}
    </MotionContainer>
  );
};

export default DashboardLayout;