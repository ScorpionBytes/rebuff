import pytest
from langchain.chains import LLMChain
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

from fixtures import server
from rebuff import Rebuff


# Define the integration test for detecting prompt injection
def test_detect_prompt_injection(server):
    # Initialize the Rebuff SDK with the actual API token and URL
    rb = Rebuff(api_token="actual_token", api_url="https://actual-api.rebuff.ai/detect")

    # Set up the LangChain SDK with the actual API key
    llm = OpenAI(api_key="actual_api_key", temperature=0.9)

    # Define the prompt template for text-to-SQL conversion
    prompt_template = PromptTemplate(
        input_variables=["user_query"],
        template="Convert the following text to SQL: {user_query}",
    )

    # Define a user input that is potentially vulnerable to SQL injection
    user_input = "Find all users; DROP TABLE users;"

    # Check for prompt injection (SQL injection in this case) using Rebuff
    if rb.is_injection_detected(user_input):
        print("Possible SQL injection detected. Take corrective action.")
        return

    # Add a canary word to the prompt template using Rebuff
    buffed_prompt, canary_word = rb.add_canaryword(prompt_template)

    # Set up the LangChain with the protected prompt
    chain = LLMChain(llm=llm, prompt=buffed_prompt)

    # Send the protected prompt to the LangChain LLM
    completion = chain.run(user_input)

    # Check for canary word leakage using Rebuff
    if rb.is_canaryword_leaked(completion, canary_word):
        print("Canaryword detected in the response. A leak has occurred!")
        return

    # If no prompt injection or leakage is detected, the test passes
    print("No prompt injection or leakage detected. Test passed.")