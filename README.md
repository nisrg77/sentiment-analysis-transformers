# Sentiment Analysis Transformers

A real-time AI-powered sentiment analysis application that leverages fine-tuned BERT transformer models (via Gemini API) and fallback baseline models (TF-IDF + Logistic Regression). It features a fast and interactive React frontend and an Express backend.

## Features

- **Real-time Live Feed Simulation**: Automatically generates and analyzes incoming streams of text (social media, support tickets, app store reviews).
- **Dual Prediction Engine**: 
  - Primary: High-accuracy classification using Google's Gemini API acting as a proxy for a fine-tuned BERT model, extracting rich attention weights and probabilities.
  - Fallback: Offline Baseline Prediction (TF-IDF) mechanism ensuring zero downtime.
- **Deep Insights**: Retrieves sentiment class (Joy, Sadness, Anger, Fear, Love, Surprise), confidence scores, and self-attention mapping explanations.
- **Fast & Responsive UI**: Built with React, TailwindCSS, and Vite for optimal performance and aesthetics.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS 4, Motion (Animations), Lucide React (Icons).
- **Backend**: Node.js, Express, TypeScript, tsx.
- **AI Integration**: `@google/genai` (Gemini Flash).

## Run Locally

### Prerequisites
- Node.js (v18+ recommended)
- A Gemini API Key from Google AI Studio

### Setup Instructions

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (or `.env.local`) in the root directory and set your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. The server will start locally. Access the application in your browser.

## Build for Production

To build the full-stack application (Vite + esbuild for server):
```bash
npm run build
npm run start
```
