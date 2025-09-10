# My Portfolio Website

Welcome to my personal portfolio website repository! This project showcases my skills, experience, and projects in a clean and interactive manner.

## ✨ Features

*   **Dynamic Content:** All sections are populated from CSV files, making content updates easy and flexible.
*   **Responsive Design:** Optimized for various devices, from desktops to mobile phones.
*   **Interactive UI:** Engaging user experience with smooth transitions and animations.
*   **Themeable:** Supports different themes for personalized viewing.

## 🚀 Technologies Used

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Build Tool:** Vite
*   **Data Handling:** CSV files

## ⚙️ Setup and Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   pnpm (or npm/yarn, but pnpm is preferred as per project configuration)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-portfolio.git
    cd your-portfolio
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add any necessary environment variables. (e.g., `VITE_SOME_API_KEY=your_key_here` if your project uses any external APIs).

4.  **Run the development server:**
    ```bash
    pnpm run dev
    ```
    The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## 📂 Data Structure

This portfolio uses CSV files to manage its content dynamically. You'll find example CSV files in the `data_templates` directory. To populate your portfolio, create a `public/data` directory and place your filled CSV files there, following the structure of the examples.

**Important:** Your personal data in `public/data` will be ignored by Git to protect your privacy. Only the structure and example files are committed to the repository.

## 🤝 Contributing

Feel free to fork this repository, customize it, and use it as your own portfolio. If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).