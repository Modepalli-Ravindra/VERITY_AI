import requests

texts = {
    'normal_human': 'I went to the store today to buy some groceries. The weather was really nice so I decided to walk instead of taking the car.',
    'formal_human': 'The proposed architecture leverages a distributed microservices paradigm to enhance scalability and fault tolerance. By decoupling the core components, the system achieves higher availability during peak load events.',
    'student_essay': 'In conclusion, the themes of isolation and alienation in the novel reflect the author\'s own struggles with society. The protagonist\'s journey ultimately demonstrates that true connection is difficult but necessary.',
    'ai_generated': 'As an AI language model, I do not have personal feelings. However, it is widely recognized that regular exercise provides numerous health benefits, including improved cardiovascular function and enhanced mental well-being.'
}

for name, text in texts.items():
    try:
        response = requests.post('http://localhost:8000/api/analyze', json={'text': text}, timeout=10)
        print(f'--- {name} ---')
        if response.status_code == 200:
            data = response.json()
            print(f"Class: {data.get('classification')}, AI Prob: {data.get('ai_probability')}")
        else:
            print(f'Error: {response.status_code} - {response.text}')
    except Exception as e:
        print(f"Exception for {name}: {e}")
