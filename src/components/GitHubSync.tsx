import React, { useState, useEffect } from 'react';
import { 
  Github, 
  RefreshCw, 
  CloudUpload, 
  CloudDownload, 
  Unlink, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Info,
  HelpCircle,
  Clock
} from 'lucide-react';
import { ActivityPattern, NOKContact } from '../types';

interface GitHubSyncProps {
  patterns: ActivityPattern[];
  onPatternsRestore: (patterns: ActivityPattern[]) => void;
  nok: NOKContact | null;
  onNokRestore: (nok: NOKContact) => void;
  inactivityThreshold: number;
  onInactivityRestore: (mins: number) => void;
}

export default function GitHubSync({
  patterns,
  onPatternsRestore,
  nok,
  onNokRestore,
  inactivityThreshold,
  onInactivityRestore,
}: GitHubSyncProps) {
  const [token, setToken] = useState(() => localStorage.getItem('guardian_pulse_github_token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('guardian_pulse_github_gist_id') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('guardian_pulse_github_username') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('guardian_pulse_github_avatar') || '');
  
  const [showTokenInput, setShowTokenInput] = useState(!localStorage.getItem('guardian_pulse_github_token'));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('guardian_pulse_github_last_sync') || '');

  // Verify the saved token or fetch profile on load
  useEffect(() => {
    if (token && !username) {
      verifyTokenAndFetchProfile(token);
    }
  }, []);

  const verifyTokenAndFetchProfile = async (accessToken: string) => {
    if (!accessToken.trim()) {
      setStatus('error');
      setMessage('Please enter a valid GitHub token.');
      return false;
    }

    setStatus('loading');
    setMessage('Verifying GitHub token...');

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token. Please check your token scopes and try again.');
      }

      const userData = await response.json();
      const fetchedUsername = userData.login;
      const fetchedAvatar = userData.avatar_url;

      setUsername(fetchedUsername);
      setAvatar(fetchedAvatar);
      localStorage.setItem('guardian_pulse_github_token', accessToken);
      localStorage.setItem('guardian_pulse_github_username', fetchedUsername);
      localStorage.setItem('guardian_pulse_github_avatar', fetchedAvatar);
      
      setStatus('success');
      setMessage(`Successfully connected as @${fetchedUsername}!`);
      setShowTokenInput(false);
      return true;
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'Verification failed. Make sure your internet is working.');
      return false;
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('guardian_pulse_github_token');
    localStorage.removeItem('guardian_pulse_github_gist_id');
    localStorage.removeItem('guardian_pulse_github_username');
    localStorage.removeItem('guardian_pulse_github_avatar');
    localStorage.removeItem('guardian_pulse_github_last_sync');
    setToken('');
    setGistId('');
    setUsername('');
    setAvatar('');
    setLastSyncTime('');
    setShowTokenInput(true);
    setStatus('success');
    setMessage('Disconnected GitHub account successfully.');
  };

  const handleBackup = async () => {
    const accessToken = localStorage.getItem('guardian_pulse_github_token');
    if (!accessToken) {
      setStatus('error');
      setMessage('GitHub is not linked or authenticated.');
      return;
    }

    setStatus('loading');
    setMessage('Backing up data to GitHub Gist...');

    const backupPayload = {
      patterns,
      nok,
      inactivityThreshold,
      updatedAt: new Date().toISOString(),
      app: 'guardian-pulse'
    };

    const gistData = {
      description: 'Guardian Pulse - Safety App Backup Baseline & Preferences',
      public: false,
      files: {
        'guardian-pulse-backup.json': {
          content: JSON.stringify(backupPayload, null, 2),
        },
      },
    };

    try {
      let url = 'https://api.github.com/gists';
      let method = 'POST';

      // If we have a gistId, check if it can be updated or if we need to fall back
      if (gistId) {
        url = `https://api.github.com/gists/${gistId}`;
        method = 'PATCH';
      }

      let response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData),
      });

      // Handle Gist previously deleted ("github is already is deleted")
      if (method === 'PATCH' && response.status === 404) {
        console.warn('Backup Gist has been deleted on GitHub. Re-creating a new Gist...');
        // Fallback: create a new Gist
        url = 'https://api.github.com/gists';
        method = 'POST';
        response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gistData),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to save data. (${response.status})`);
      }

      const result = await response.json();
      const newGistId = result.id;
      
      setGistId(newGistId);
      localStorage.setItem('guardian_pulse_github_gist_id', newGistId);
      
      const timeString = new Date().toLocaleString();
      setLastSyncTime(timeString);
      localStorage.setItem('guardian_pulse_github_last_sync', timeString);

      setStatus('success');
      setMessage('Baseline & Preferences successfully backed up!');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'Backup failed. Please check your connection.');
    }
  };

  const handleRestore = async () => {
    const accessToken = localStorage.getItem('guardian_pulse_github_token');
    if (!accessToken) {
      setStatus('error');
      setMessage('GitHub is not linked or authenticated.');
      return;
    }

    if (!gistId) {
      setStatus('error');
      setMessage('No backup found yet. Create a backup first!');
      return;
    }

    setStatus('loading');
    setMessage('Restoring data from GitHub Gist...');

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (response.status === 404) {
        throw new Error('Your backup gist was not found on GitHub (it may have been deleted). Resetting your sync link.');
      }

      if (!response.ok) {
        throw new Error(`Restore failed. (${response.status})`);
      }

      const result = await response.json();
      const backupFile = result.files['guardian-pulse-backup.json'];
      
      if (!backupFile || !backupFile.content) {
        throw new Error('Backup file format in Gist is invalid or missing.');
      }

      const payload = JSON.parse(backupFile.content);
      
      if (payload.patterns) {
        onPatternsRestore(payload.patterns);
      }
      if (payload.nok) {
        onNokRestore(payload.nok);
      }
      if (payload.inactivityThreshold) {
        onInactivityRestore(payload.inactivityThreshold);
      }

      setStatus('success');
      setMessage('All settings and activity patterns successfully restored!');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'Restore failed.');
      
      if (error.message.includes('deleted')) {
        // Clear gist ID to allow a fresh backup
        setGistId('');
        localStorage.removeItem('guardian_pulse_github_gist_id');
      }
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-white" />
          <h3 className="font-bold text-sm text-zinc-100">GitHub Cloud Sync</h3>
        </div>
        {username && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5ClassName animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Linked
          </span>
        )}
      </div>

      {username ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Linked User Profile Details */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={username} 
                  className="w-10 h-10 rounded-full border border-zinc-700" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                  <Github className="w-5 h-5 text-zinc-300" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-100">@{username}</p>
                <p className="text-xs text-zinc-500">Destination: Gist Storage</p>
              </div>
            </div>
            
            <button 
              onClick={handleDisconnect}
              className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Remove GitHub Link"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Last Sync</span>
              <span className="font-medium text-zinc-300 tracking-tight flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {lastSyncTime ? lastSyncTime.split(',')[0] : 'Never'}
              </span>
            </div>
            <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Backup ID</span>
              <span className="font-mono text-[10px] text-zinc-400 truncate block">
                {gistId ? gistId.substring(0, 10) + '...' : 'None Generated'}
              </span>
            </div>
          </div>

          {/* Backup & Restore Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBackup}
              disabled={status === 'loading'}
              className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4" />
              Backup Now
            </button>
            <button
              onClick={handleRestore}
              disabled={status === 'loading' || !gistId}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudDownload className="w-4 h-4" />
              Restore Now
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex gap-3 text-xs leading-relaxed text-zinc-400">
            <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              Link your GitHub account using a <span className="text-zinc-100 font-medium">Personal Access Token (PAT)</span>. 
              Your learned baseline activity patterns and Next of Kin settings will be backed up securely to a private GitHub Gist, allowing seamlessly synced backups across devices!
            </p>
          </div>

          {showTokenInput && (
            <div className="space-y-2.5">
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="password"
                  placeholder="Paste GitHub Token (PAT)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                <span>Requires a token with <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">gist</code> scopes.</span>
                <a 
                  href="https://github.com/settings/tokens/new" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-emerald-500 hover:underline font-bold"
                >
                  Generate →
                </a>
              </div>

              <button
                onClick={() => verifyTokenAndFetchProfile(token)}
                disabled={status === 'loading'}
                className="w-full py-3 bg-zinc-100 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest hover:bg-white transition-all active:scale-95 disabled:opacity-50"
              >
                Connect Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Status Bar */}
      {status !== 'idle' && (
        <div className={`p-3 rounded-xl text-xs flex gap-2.5 items-start ${
          status === 'loading' ? 'bg-zinc-800/50 border border-zinc-800 text-zinc-300' :
          status === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
          'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {status === 'loading' && <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin mt-0.5 flex-shrink-0" />}
          {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />}
          {status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
          <div className="flex-1 font-medium">{message}</div>
        </div>
      )}
    </div>
  );
}
