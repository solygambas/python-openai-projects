from langchain.llms import OpenAI
from langchain.agents import load_tools, initialize_agent, AgentType
from dotenv import dotenv_values

config = dotenv_values(".env")

llm = OpenAI(openai_api_key=config["OPENAI_API_KEY"], temperature=0.0)

tools = load_tools(["wikipedia", "llm-math"], llm=llm)
# https://python.langchain.com/docs/modules/agents/tools/

agent = initialize_agent(
    tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True
)

prompt = input("The Wikipedia research task: ")

agent.run(prompt)

# The Wikipedia research task: How old is President Biden?


# > Entering new  chain...
#  I need to find out the age of President Biden.
# Action: Wikipedia
# Action Input: Joe Biden
# Observation: Page: Joe Biden
# Summary: Joseph Robinette Biden Jr. ( (listen) BY-dən; born November 20, 1942) is an American politician who is the 46th and current president of the United States. A member of the Democratic Party, he previously served as the 47th vice president from 2009 to 2017 under President Barack Obama and represented Delaware in the United States Senate from 1973 to 2009.
# Born in Scranton, Pennsylvania, Biden moved with his family to Delaware in 1953. He studied at the University of Delaware before earning his law degree from Syracuse University. He was elected to the New Castle County Council in 1970 and became the sixth-youngest senator in U.S. history after he was elected in 1972, at age 29. Biden was the chair or ranking member of the Senate Foreign Relations Committee for 12 years. He chaired the Senate Judiciary Committee from 1987 to 1995; drafted and led the effort to pass the Violent Crime Control and Law Enforcement Act and the Violence Against Women Act; and oversaw six U.S. Supreme Court confirmation hearings, including the contentious hearings for Robert Bork and Clarence Thomas. Biden ran unsuccessfully for the Democratic presidential nomination in 1988 and 2008. Barack Obama chose him as his running mate in the 2008 and 2012 presidential elections. Biden was a close counselor to Obama during his two terms as vice president. He also oversaw infrastructure spending to counteract the Great Recession and had a principal role in designing the withdrawal of United States troops from Iraq. In the 2020 presidential election, Biden and his running mate, Kamala Harris, defeated incumbents Donald Trump and Mike Pence.
# On January 20, 2021, at the age of 78, Biden became the oldest president in U.S. history, the first to have a female vice president, and the first from Delaware. Biden restored America's membership in the Paris Agreement, and signed a $1.9 trillion economic stimulus package in response to the recession caused by the COVID-19 pandemic, a bipartisan bill investing in infrastructure, and the CHIPS and Science Act. Aspects of Biden's Build Back Better Plan were scaled back and presented in the Inflation Reduction Act that was passed by Congress and signed into law by Biden in 2022. The economy during Biden's presidency has been marked by GDP growth and job creation amid significantly elevated inflation. He appointed Ketanji Brown Jackson to the Supreme Court. In 2023, Biden and congressional Republicans prevented a default by negotiating a deal to raise the debt ceiling. In foreign policy, Biden oversaw the withdrawal of U.S. troops from Afghanistan that ended the war in Afghanistan, during which the Afghan government collapsed and the Taliban seized control. He has responded to the Russian invasion of Ukraine by imposing sanctions on Russia and authorizing foreign aid and weapons shipments to Ukraine. On April 25, 2023, Biden announced his intention to run for a second term as president in 2024.

# Page: Family of Joe Biden
# Summary: Joe Biden, the 46th and current president of the United States, has family members who are prominent in law, education, activism and politics. Biden's immediate family became the first family of the United States on his inauguration on January 20, 2021. His immediate family circle was also the second family of the United States from 2009 to 2017, when Biden was vice president.  Biden's family is mostly descended from the British Isles, with most of their ancestors coming from Ireland and England, and a smaller number descending from the France.Of Joe Biden's sixteen great-great grandparents, ten were born in Ireland. He is descended from the Blewitts of County Mayo and the Finnegans of County Louth. One of Biden's great-great-great grandfathers was born in Sussex, England, and emigrated to Maryland in the United States by 1820.

# Page: Presidency of Joe Biden
# Summary: Joe Biden's tenure as the 46th president of the United States began with his inauguration on January 20, 2021. Bi
# Thought: I now know the final answer
# Final Answer: Joe Biden is 78 years old.
