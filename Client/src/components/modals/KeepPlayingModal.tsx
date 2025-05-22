import { useTrackSignupClick } from '../../backend/signup.analytics.service';

interface KeepPlayingModalProps {
  open: boolean;
  onClose: () => void;
  openSignUpModal: () => void;
}

export default function KeepPlayingModal({ open, onClose, openSignUpModal }: KeepPlayingModalProps) {
  const { mutate: trackSignup } = useTrackSignupClick();

  const handleSignupClick = () => {
    trackSignup({ type: 'keep-playing' });
    onClose();
    openSignUpModal();
  };

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
      <div className="relative bg-white dark:bg-[#475568] rounded-2xl shadow-lg p-8 min-w-[350px] max-w-[90vw]">
        <button
          className="absolute -top-5 -right-5 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={onClose}
          aria-label="Close"
          style={{ border: 'none' }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-5xl tracking-wide font-extrabold mb-4 text-[#18181b] dark:text-white">Wanna keep on playing!?</h1>
          <div className='flex items-center justify-center gap-3'>
            <button
              onClick={handleSignupClick}
              className='flex items-center gap-1 hover:opacity-90 transition-opacity'
            >
              <span className='text-[#e87ff8] text-3xl font-extrabold hover:underline'>Sign up</span>
              <span className='text-[#18181b] text-3xl font-bold dark:text-white'>now!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
