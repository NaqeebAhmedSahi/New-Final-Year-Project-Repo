import json
import sys
import os
from jinja2 import Template

# Ensure the script receives a file path argument
if len(sys.argv) < 2:
    print("Error: No file path provided.")
    sys.exit(1)

# Get the file path from the command-line argument
file_path = sys.argv[1]

# Verify if the file exists
if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    sys.exit(1)

# Sample dynamic data for rendering
response_data = {
    "name": "John Doe",
    "hobbies": ["Reading", "Coding", "Gaming"]
}

try:
    # Load the HTML template from the provided file path
    with open(file_path, "r", encoding="utf-8") as file:
        template_content = file.read()

    # Render the template with Jinja2
    template = Template(template_content)
    rendered_html = template.render(response_data)

    # Print the rendered HTML to stdout (Node.js will capture this)
    print(rendered_html)

except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)
