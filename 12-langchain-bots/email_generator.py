from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from dotenv import dotenv_values

config = dotenv_values(".env")

llm = OpenAI(openai_api_key=config["OPENAI_API_KEY"], temperature=0.0)

prompt = PromptTemplate(
    input_variables=["content", "customer_name", "agent_name"],
    template="""
    You are an AI assistant that's optimized to write concise, friendly & professional emails to customers.

    Write an email to a customer with the name {customer_name} that contains the following, optimized content: {content}

    The email signature should contain the name of the customer agent who wrote the email: {agent_name}
    """,
)

content = input("Email content: ")
# sorry about the broken cup, we can replace it or provide a refund
customer = input("Customer name: ")
agent = input("Agent name: ")

response = llm(prompt.format(content=content, customer_name=customer, agent_name=agent))

print(response)

# Dear Gianluca,

# We apologize for the broken cup you received. We would be happy to replace it or provide a refund. Please let us know which option you would prefer.

# Thank you for your patience and understanding.

# Sincerely,
# Mario
# Customer Agent
