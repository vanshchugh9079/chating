import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { store, persistor } from './redux/store'; // Import persistor
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; // Import PersistGate
import { SocketProvider } from './socket/SocketContext';
import { StrictMode } from 'react';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          <App />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
