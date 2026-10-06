# Google Colab Setup for V5 ModernBERT

This guide explains how to run the V5 ModernBERT experimental training pipeline on a Google Colab GPU.

## 1. Open Google Colab
Go to [Google Colab](https://colab.research.google.com/) and create a new notebook.

## 2. Select GPU Runtime
1. Click on `Runtime` > `Change runtime type` in the top menu.
2. Under `Hardware accelerator`, select **GPU** (T4, V100, or A100).
3. Click `Save`.

## 3. Clone the V5 Experiment
Run the following cell to clone the repository and navigate to the project directory:
```bash
!git clone <YOUR_REPO_URL> verity
%cd verity
```

## 4. Install Dependencies
Install the required packages, including PyTorch with CUDA and Transformers:
```bash
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
!pip install transformers pydantic
!pip install -r backend/requirements.txt
```

## 5. Verify GPU
Ensure PyTorch detects the GPU:
```python
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
```

## 6. Verify Dataset Access
Ensure the datasets are properly downloaded and mounted in `dataset/` relative to the workspace.
If using Google Drive, mount it:
```python
from google.colab import drive
drive.mount('/content/drive')
```
And copy the datasets into `verity/dataset/`.

## 7. Run Smoke Test
Before running full training, execute the smoke test to verify tensor shapes and imports:
```bash
!python experiments/v5_modernbert/smoke_test.py
```
*Do not proceed if the smoke test fails.*

## 8. Start Actual Training
Start the V5 training pipeline with mixed precision enabled:
```bash
!python experiments/v5_modernbert/train_v5.py
```

## 9. Save Checkpoints
Checkpoints will be saved in `experiments/v5_modernbert/checkpoints/`. It is recommended to copy these to your Google Drive to prevent loss when the Colab instance shuts down:
```bash
!cp -r experiments/v5_modernbert/checkpoints/ /content/drive/MyDrive/verity_v5_checkpoints/
```

## 10. Run Evaluation
After training completes, run the evaluation script to calculate metrics across all dataset splits:
```bash
!python experiments/v5_modernbert/evaluate_v5.py
```
