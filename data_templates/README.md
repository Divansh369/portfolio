# Data Templates

This directory contains example CSV files that define the structure for the data used in the portfolio website. These files only include the header rows, serving as templates for you to populate with your own information.

## How to Use

1.  **Create a `public/data` directory** in the root of your project if it doesn't already exist.
2.  **Copy** the desired `.example.csv` files from this `data_templates` directory into your newly created `public/data` directory.
3.  **Rename** the copied files by removing the `.example` suffix (e.g., `about.example.csv` becomes `about.csv`).
4.  **Populate** these CSV files with your actual data. Ensure you maintain the exact column names as provided in the headers.

**Important:** The `public/data` directory and its contents are automatically ignored by Git (via `.gitignore`) to protect your personal information. Only these example templates are committed to the repository.

## Example: `experience.example.csv`

The `experience.example.csv` file is used to showcase your professional work experience. Here's a breakdown of its columns:

*   `role`: Your job title or role (e.g., "Software Engineer", "Lead Developer").
*   `company`: The name of the company or organization.
*   `location`: The location of the company or your work (e.g., "San Francisco, CA", "Remote").
*   `duration`: The period of your employment (e.g., "Jan 2020 - Present", "Summer 2019").
*   `description`: A detailed description of your responsibilities and achievements. You can use Markdown for formatting within this field.
*   `skills`: A comma-separated list of skills you utilized or gained in this role (e.g., "React, Node.js, AWS").
*   `logo`: The path to the company's logo image (e.g., `/images/logos/company_logo.png`). This path should be relative to the `public` directory.

**Example Row (after populating `experience.csv`):**

```csv
role,company,location,duration,description,skills,logo
"Software Engineer","Tech Solutions Inc.","New York, NY","Jan 2022 - Present","Developed and maintained web applications using React and Node.js. Implemented new features and optimized existing codebase.","React, Node.js, JavaScript, MongoDB","/images/logos/tech_solutions.png"
```

Remember to enclose any fields containing commas or newlines within double quotes.
