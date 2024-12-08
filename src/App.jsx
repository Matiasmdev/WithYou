import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Youtube, Rewind, FastForward, Users, X, Link, EyeOff, Eye, Copy, CheckCheck, Trash2, LogOut } from 'lucide-react';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';
import axios from 'axios';
import VideoChat from './components/VideoChat'; // Importar el componente VideoChat

const socket = io('http://localhost:3000');

const WelcomeScreen = ({ onCreateRoom, onJoinRoom }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateRoom = () => {
    if (name.trim()) {
      onCreateRoom(name);
    }
  };

  const handleJoinRoom = () => {
    if (!showJoinInput) {
      setShowJoinInput(true);
    }
  };

  const handleEnterRoom = () => {
    if (name.trim() && roomCode.trim()) {
      onJoinRoom(name, roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="text-center w-full max-w-md px-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
          WithYou
        </h1>
        <p className="text-base sm:text-xl mb-6">El día está para ver algo juntos. ¿Cuál es tu nombre?</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingresa tu nombre"
          className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 rounded-full mb-4 sm:mb-6 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-600"
        />

        <div className="flex space-x-2 sm:space-x-4">
          <button
            onClick={handleCreateRoom}
            disabled={!name.trim()}
            className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base transition-all ${
              name.trim()
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Crear Sala
          </button>

          <button
            onClick={handleJoinRoom}
            disabled={!name.trim()}
            className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base transition-all ${
              name.trim()
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Unirse
          </button>
        </div>

        {showJoinInput && (
          <div className="mt-4">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Introduzca código de sala"
              className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 rounded-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
            {roomCode.trim() && (
              <button
                onClick={handleEnterRoom}
                className="mt-4 w-full px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base transition-all bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
              >
                Entrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(true);
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [notification, setNotification] = useState('');
  const [hostName, setHostName] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    // Generar un código de sala aleatorio
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  const handleCreateRoom = (name) => {
    setUserName(name);
    setHostName(name); // Establecer el nombre del host
    socket.emit('createRoom', roomCode, name);
    setIsWelcomeScreen(false);
  };

  const handleJoinRoom = (name, code) => {
    setUserName(name);
    setRoomCode(code);
    socket.emit('joinRoom', code, name);
    setIsWelcomeScreen(false);
  };

  const handleLogout = () => {
    setIsWelcomeScreen(true);
    setUserName('');
    setRoomCode('');
    setIsHidden(false);
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClearVideoUrl = () => {
    setVideoUrl('');
    socket.emit('setVideoUrl', roomCode, '');
  };

  useEffect(() => {
    socket.on('roomCreated', (code) => {
      setRoomCode(code);
    });

    socket.on('roomJoined', (code) => {
      setRoomCode(code);
    });

    socket.on('roomNotFound', () => {
      alert('Room not found');
    });

    socket.on('play_video', () => {
      videoRef.current.getInternalPlayer().playVideo();
      setIsPlaying(true);
    });

    socket.on('pause_video', () => {
      videoRef.current.getInternalPlayer().pauseVideo();
      setIsPlaying(false);
    });

    socket.on('seekVideo', (time) => {
      videoRef.current.seekTo(time);
    });

    socket.on('videoUrl', (url) => {
      setVideoUrl(url);
    });

    socket.on('guestJoined', (guestName) => {
      setNotification(`${guestName} se ha unido!`);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('hostName', (name) => {
      setHostName(name);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomNotFound');
      socket.off('play_video');
      socket.off('pause_video');
      socket.off('seekVideo');
      socket.off('videoUrl');
      socket.off('guestJoined');
      socket.off('hostName');
    };
  }, []);

  const handlePlay = () => {
    socket.emit('play_video', roomCode);
    setIsPlaying(true);
  };

  const handlePause = () => {
    socket.emit('pause_video', roomCode);
    setIsPlaying(false);
  };

  const handleRewind = () => {
    const currentTime = videoRef.current.getCurrentTime();
    const newTime = Math.max(currentTime - 10, 0);
    socket.emit('seekVideo', roomCode, newTime);
  };

  const handleFastForward = () => {
    const currentTime = videoRef.current.getCurrentTime();
    const newTime = currentTime + 10;
    socket.emit('seekVideo', roomCode, newTime);
  };

  const handleVideoUrlChange = (e) => {
    const url = e.target.value;
    setVideoUrl(url);
    socket.emit('setVideoUrl', roomCode, url);
  };

  const handleYoutubeClick = () => {
    window.open('https://www.youtube.com', '_blank');
  };

  if (isWelcomeScreen) {
    return <WelcomeScreen
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />;
  }

  return (
    <div className={`min-h-screen bg-black flex flex-col ${isHidden ? 'overflow-hidden' : ''}`}>
      {/* Información de la sala y botón de ocultar */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        {!isHidden && (
          <>
            <span className="text-xs text-white/70 mr-2">
              {hostName ? `sala de ${hostName}: ${roomCode}` : `sala de ${userName}: ${roomCode}`}
            </span>
            <button
              onClick={handleCopyRoomCode}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-1 rounded-full transition-all relative"
            >
              {isCopied ? (
                <CheckCheck className="text-green-500 w-4 h-4" />
              ) : (
                <Copy className="text-white w-4 h-4" />
              )}
            </button>
          </>
        )}
        <button
          onClick={() => setIsHidden(!isHidden)}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full transition-all"
        >
          {isHidden ? <Eye className="text-white w-5 h-5" /> : <EyeOff className="text-white w-5 h-5" />}
        </button>
      </div>

      {/* Encabezado */}
      {!isHidden && (
        <header className="sticky top-0 z-10 bg-gray-900/40 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="text-white w-8 h-8" />
              <span className="text-white font-bold text-xl">
              WithYou
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Contenedor principal de contenido */}
      <div className={`flex-grow container mx-auto px-0 py-0 flex flex-col ${isHidden ? 'p-0' : ''}`}>
        {/* Contenedor de video */}
        <main className="flex flex-col items-center justify-center relative w-full">
          {/* Control de retroceso */}
          {!isHidden && (
            <div className="absolute left-0 top-1/2 transform translate-y-24 sm:translate-y-12 z-10">
              <button
                onClick={handleRewind}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all"
              >
                <Rewind className="text-white" />
              </button>
            </div>
          )}

          {/* Área de video */}
          <div className="w-full aspect-video bg-gray-900 overflow-hidden shadow-2xl relative sm:landscape:w-6/6 sm:landscape:h-screen">

            <ReactPlayer
              ref={videoRef}
              url={videoUrl}
              playing={isPlaying}
              width="100%"
              height="100%"
              controls={true} // Habilitar los controles del reproductor
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 0,
                    mute: 0, // Desactivar el mute para que el video tenga sonido
                    cc_lang_pref: 'es', // Preferencia de idioma para subtítulos
                    cc_load_policy: 1, // Habilitar subtítulos automáticamente
                    hl: 'es', // Idioma de la interfaz de YouTube
                  },
                },
              }}
              className="w-full h-full"
              style={{ margin: 0, padding: 0 }}
            />
          </div>

          {/* Control de adelantar */}
          {!isHidden && (
            <div className="absolute right-0 top-1/2 transform translate-y-24 sm:translate-y-12 z-10">
              <button
                onClick={handleFastForward}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all"
              >
                <FastForward className="text-white" />
              </button>
            </div>
          )}

          {/* Botones de reproducir y pausar - Ahora debajo del video */}
          {!isHidden && (
            <div className="mt-6 sm:mt-4 flex space-x-4">
              <button
                onClick={handlePlay}
                className={`p-3 rounded-full transition-all ${
                  isPlaying
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                <Play className="w-8 h-8" />
              </button>
              <button
                onClick={handlePause}
                className={`p-3 rounded-full transition-all ${
                  isPlaying
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Pause className="w-8 h-8" />
              </button>
            </div>
          )}
        </main>

        {/* Entrada de URL - Ahora debajo del video */}
        {!isHidden && (
          <div className="container mx-auto px-4 py-4 mt-6 sm:mt-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Pega el link de YouTube"
                value={videoUrl}
                onChange={handleVideoUrlChange}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 text-white rounded-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              {videoUrl && (
                <>
                  <button
                    onClick={() => setVideoUrl('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="text-gray-400 w-5 h-5 hover:text-white" />
                  </button>
                  <button
                    onClick={handleClearVideoUrl}
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full transition-all"
                  >
                    <Trash2 className="text-white w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* VideoChat Component */}
        <VideoChat isHost={userName === hostName} isPlaying={isPlaying} videoUrl={videoUrl} />

      </div>

      {/* Controles de llamada */}
      {!isHidden && (
        <footer className="sticky bottom-0 bg-gray-900/40 backdrop-blur-md py-4">
          <div className="container mx-auto px-4 flex items-center">
            <div className="mr-auto">
              <button
                onClick={handleYoutubeClick}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all"
              >
                <Youtube className="text-white" />
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Pie de página del desarrollador */}
      {!isHidden && (
        <div className="bg-gray-900/20 py-2 text-center">
          <p className="text-white/70 text-sm">
            Hecho con ❤️ por Sebadev
          </p>
        </div>
      )}

      {/* Notificación */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/80 p-4 rounded-lg text-white text-center text-2xl">
            {notification}
          </div>
        </div>
      )}
    </div>
  );
};

// Función para obtener información del video de YouTube

export default App;
