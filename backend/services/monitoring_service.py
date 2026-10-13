import time
import os
from typing import Dict, Any, List
from collections import deque

class MonitoringService:
    _instance = None
    
    def __init__(self):
        self.start_time = time.time()
        self.latencies: deque = deque(maxlen=200)
        self.request_count = 0
        self.error_count = 0
        self.endpoint_counts: Dict[str, int] = {}
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def record_request(self, endpoint: str, latency_ms: float, is_error: bool = False):
        self.request_count += 1
        if is_error:
            self.error_count += 1
        self.latencies.append(latency_ms)
        self.endpoint_counts[endpoint] = self.endpoint_counts.get(endpoint, 0) + 1
        
    def get_metrics(self) -> Dict[str, Any]:
        uptime = round(time.time() - self.start_time, 1)
        lat_list = sorted(list(self.latencies)) if self.latencies else [0.0]
        p50 = round(lat_list[int(len(lat_list) * 0.5)], 1) if lat_list else 0.0
        p95 = round(lat_list[int(len(lat_list) * 0.95)], 1) if lat_list else 0.0
        
        error_rate = round((self.error_count / max(1, self.request_count)) * 100, 2)
        
        from backend.services.provider_manager import ProviderManager
        primary_model = ProviderManager.get_primary_model_name()
        
        return {
            "uptime_seconds": uptime,
            "total_requests": self.request_count,
            "error_count": self.error_count,
            "error_rate_pct": error_rate,
            "latency_p50_ms": p50,
            "latency_p95_ms": p95,
            "active_model": primary_model,
            "endpoint_traffic": self.endpoint_counts,
            "status": "healthy" if error_rate < 5.0 else "degraded"
        }

    @staticmethod
    def get_dataset_registry() -> Dict[str, Any]:
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
        datasets = {
            "HC3 (Hello-SimpleAI)": {
                "role": "In-domain training and validation",
                "samples_train": 68345,
                "samples_val": 16070,
                "split_strategy": "Question-level holdout (0 question leakage)",
                "status": "available",
                "path": "dataset/v5/train.csv"
            },
            "RAID Benchmark (Sampled 20K)": {
                "role": "Out-of-domain adversarial robustness & perturbation benchmark",
                "samples": 20000,
                "composition": "10,000 Human, 10,000 AI across 11 perturbation attacks",
                "status": "available",
                "path": "dataset/raid/raid_subset.csv"
            },
            "Formal Human": {
                "role": "Hard-negative human prose validation",
                "samples": 11571,
                "status": "available",
                "path": "dataset/formal/formal_subsets.csv"
            },
            "ASAP 2.0 Student Essays": {
                "role": "Real-world academic human distribution evaluation",
                "samples": 170000,
                "status": "available",
                "path": "dataset/asap_2.0/test/ASAP_2_Final_github_test.csv"
            }
        }
        return {"datasets": datasets, "total_registered": len(datasets)}
