import json
import sys
import os
from jinja2 import Template

# Ensure the script receives a file path argument
if len(sys.argv) < 2:
    print("Error: No file path provided. Usage: python script.py <template_file>")
    sys.exit(1)

# Get the template file from the command-line argument
template_file = sys.argv[1]

# Extract the file name from the full path
template_file_name = os.path.basename(template_file)

# Load the JSON data
with open("1.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Extract the first response from the first intent
if data.get("intents"):
    first_intent = data["intents"][0]
    if first_intent.get("response"):
        response_data = first_intent["response"][0]

# Load the Jinja2 template
with open(template_file, "r", encoding="utf-8") as file:
    template_content = file.read()

# Create a Jinja2 template object
template = Template(template_content)

# Extract data based on the template file name
if template_file_name == "index.html":
    # Data for index.html
    rendered_html = template.render(
        title=response_data["website"]["title"],
        stylesheets=response_data["website"]["stylesheets"],
        navbar=response_data["website"]["navbar"],
        carousel=response_data["website"]["indexPage"]["carousel"],
        specials={
            "title": "Shop by Category",
            "menu_items": response_data["website"]["indexPage"]["collections"]["categories"]
        },
        highlights=response_data["website"]["indexPage"]["highlights"],
        testimonials=response_data["website"]["indexPage"]["testimonials"],
        gallery=response_data["website"]["indexPage"]["gallery"],
        footer=response_data["website"]["contactPage"]["footer"]
    )
elif template_file_name == "menu.html":
    # Data for menu.html
    rendered_html = template.render(website=response_data["website"])
elif template_file_name == "aboutUs.html":
    # Data for about.html
    rendered_html = template.render(aboutPage=response_data["website"]["aboutPage"])
elif template_file_name == "contact.html":
    # Data for contact.html
    rendered_html = template.render(contactPage=response_data["website"]["contactPage"])
else:
    print(f"Error: Unsupported template file '{template_file_name}'.")
    sys.exit(1)

# Save the rendered HTML to a new file with UTF-8 encoding
output_file = f"rendered_{template_file_name}"
with open(output_file, "w", encoding="utf-8") as file:
    file.write(rendered_html)

# Force the console to use UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# Print the rendered HTML to the console
print(rendered_html)

# Print a success message
# print(f"HTML file generated successfully: {output_file}")