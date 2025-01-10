from openai import OpenAI
import logging
from django.conf import settings

api_key = settings.OPENAI_API_KEY

client = OpenAI(
    api_key=api_key
)

def generate_response(messages, model="gpt-4", max_tokens=100, temperature=0.7):
    """
    Make a request to OpenAI's API and get a response based on the provided messages.
    """
    try:
        response = client.chat.completions.create(
            model=model,  # Use a model like "gpt-4" or "gpt-3.5-turbo"
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error generating AI reply: {e}")
        return "Sorry, I couldn't generate a reply."
