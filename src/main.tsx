// Start the WebGL intro first; it is tiny and needs nothing from React.
import './intro/boot'
import './index.css'

// The app (React, pages, images) loads in a separate chunk while the intro plays.
Promise.all([import('react'), import('react-dom/client'), import('./App')]).then(
  ([{ StrictMode, createElement }, ReactDOM, { default: App }]) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      createElement(StrictMode, null, createElement(App)),
    )
  },
)
