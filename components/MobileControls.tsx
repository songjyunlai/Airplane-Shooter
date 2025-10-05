import React from 'react';

interface MobileControlsProps {
  onAction: (action: string, active: boolean) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onAction }) => {
  const handleTouch = (action: string, active: boolean) => (e: React.TouchEvent) => {
    e.preventDefault();
    onAction(action, active);
  };

  const ControlButton: React.FC<{ action: string, children: React.ReactNode, className?: string }> = ({ action, children, className }) => (
    <div
      onTouchStart={handleTouch(action, true)}
      onTouchEnd={handleTouch(action, false)}
      onTouchCancel={handleTouch(action, false)}
      className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-600/50 rounded-full flex items-center justify-center text-3xl text-white select-none active:bg-gray-400/70 ${className}`}
      aria-label={`${action} control`}
      role="button"
    >
      {children}
    </div>
  );

  return (
    <div className="md:hidden fixed inset-0 z-20 pointer-events-none text-white">
      {/* D-Pad */}
      <div className="absolute bottom-5 left-5 pointer-events-auto grid grid-cols-3 grid-rows-3 gap-2 w-48 h-48 sm:w-60 sm:h-60">
        <div className="col-start-2">
            <ControlButton action="w">▲</ControlButton>
        </div>
        <div className="row-start-2">
            <ControlButton action="a">◀</ControlButton>
        </div>
        <div className="col-start-3 row-start-2">
            <ControlButton action="d">▶</ControlButton>
        </div>
        <div className="col-start-2 row-start-3">
            <ControlButton action="s">▼</ControlButton>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex flex-col items-center gap-4">
        <ControlButton action="e">⚡️</ControlButton>
        <ControlButton action="q">🔄</ControlButton>
        <div
            onTouchStart={handleTouch(' ', true)}
            onTouchEnd={handleTouch(' ', false)}
            onTouchCancel={handleTouch(' ', false)}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-red-600/50 rounded-full flex items-center justify-center text-4xl text-white select-none active:bg-red-500/70"
            aria-label="Fire control"
            role="button"
        >
            💣
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
