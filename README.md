# Gesturine Controller

<div align="center">
  <a href="https://ibb.co/k6kM13NP"><img src="https://i.ibb.co/k6kM13NP/gesturine-logo.png" alt="gesturine-logo" border="0"></a>
  <p>Control your PC with hand gestures using computer vision</p>
</div>

## Overview

Gesturine Controller is an Electron-based desktop application that allows you to control your computer using hand gestures. Built with React, TypeScript, and modern computer vision technology, it enables you to map hand gestures to keyboard shortcuts and system actions.

### Key Features

- **Real-time Hand Gesture Detection**: Supports multiple preloaded hand gestures including:
  - ✊ Fist
  - ✋ Open Palm
  - 👆 Pointing
  - ✌️ Peace Sign
  - 👍 Thumbs Up
  - 👎 Thumbs Down
  - 👌 OK Sign
  - 🤘 Rock On

\*Coming soon: Support for setting up your own gestures to key binding

- **Custom Profiles**: Create and manage multiple profiles for different applications or use cases
  - Gaming Profile
  - Productivity Profile
  - Custom Profiles

- **Configurable Keybindings**: Map any supported gesture to keyboard shortcuts
- **Hand Selection**: Choose which hand (left/right/any) triggers the action
- **Real-time Feedback**: Visual feedback for detected gestures and active bindings
- **Low Latency**: Optimized for real-time performance

## Technology Stack

- **Frontend**: React + TypeScript
- **Desktop Framework**: Electron
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **Computer Vision**: MediaPipe Hand Landmarks
- **Key Simulation**: RobotJS

## Project Setup

### Prerequisites

- Node.js (v20 or higher)
- pnpm (v7 or higher)
- Webcam/Camera for gesture detection

### Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

## Usage Guide

1. **Initial Setup**
   - Launch the application
   - Grant camera permissions when prompted
   - Select or create a profile

2. **Creating Keybindings**
   - Go to Settings
   - Click "Add New Binding"
   - Select a gesture and assign a keyboard shortcut
   - Optionally add a description and select hand preference

3. **Using Gestures**
   - Click "Start Gesture Detection" in Settings
   - Perform the configured gestures in view of your camera
   - The app will simulate the corresponding keyboard shortcuts

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Follow semantic commit messages

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for hand landmark detection
- [RobotJS](http://robotjs.io/) for system-wide keyboard control
- [Electron](https://www.electronjs.org/) for the desktop runtime
- [React](https://reactjs.org/) for the frontend framework
- [Electron Vite](https://electron-vite.org/) for the project setup
- [Zustand](https://github.com/pmndrs/zustand) for state management

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/bhavesh-kratos/gesturine-controller/issues) section
2. Create a new issue with detailed information
3. Join our community discussions at discord: [Discord](https://discord.gg/6NnTm2b4MJ)
