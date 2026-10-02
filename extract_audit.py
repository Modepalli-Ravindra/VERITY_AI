import json
import re

try:
    with open('scratch_audit.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    print(e)
    exit(1)

print('--- STYLOMETRICS ---')
stylo = data.get('stylometrics', '')
# find the dictionary keys in extract_stylometric_features
features = re.findall(r'"([a-z_]+)":', stylo)
if not features:
    features = re.findall(r"'([a-z_]+)':", stylo)
print(list(set(features)))

print('\n--- MODEL & THRESHOLD ---')
fusion = data.get('fusion_model', '')
print('Threshold:', re.findall(r'threshold\s*=\s*[\d.]+', fusion))
verity = data.get('verity_model', '')
print('Dimensions:', re.findall(r'self.semantic_dense.*?Linear\((\d+),\s*(\d+)\)', verity))
print('Dimensions Styl:', re.findall(r'self.stylo_dense.*?Linear\((\d+),\s*(\d+)\)', verity))
print('Layers Frozen:', re.findall(r'param.requires_grad\s*=\s*False', verity))
print('Model Name:', re.findall(r'from_pretrained\([\'"]([^\'"]+)[\'"]', verity))

print('\n--- LLM FALLBACK ---')
pm = data.get('provider_manager', '')
print('Providers:', re.findall(r'PROVIDERS_MAP\.keys\(\)', pm))
print('Analyze Method Fallback Logic:', re.findall(r'for\s+provider_name.*?in.*?:', pm, re.DOTALL)[:2])

print('\n--- COMPARE PAGE ---')
compare = data.get('compare_page', '')
print('aiProbDrop logic:', re.findall(r'const\s+aiProbDrop\s*=\s*.*', compare))

print('\n--- ROUTER API ---')
router = data.get('router', '')
print('Response schema:', re.findall(r'class\s+DetectionResponse\(BaseModel\):.*?(?:class|$)', router, re.DOTALL)[:1])

print('\n--- FRONTEND ---')
dash = data.get('dashboard', '')
print('Dashboard Total analyses logic:', re.findall(r'totalAnalyses = .*', dash))

print('\n--- PACKAGE & REQUIREMENTS ---')
package = data.get('package', '')
if package and not package.startswith('['):
    try:
        j = json.loads(package)
        print('Dependencies:', list(j.get('dependencies', {}).keys()))
    except:
        pass
print('Requirements:', data.get('requirements', '').split('\n')[:15])
