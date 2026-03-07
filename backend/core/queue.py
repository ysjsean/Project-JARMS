import heapq
from typing import List
from models.case import Case, Severity


class CaseQueue:

    def __init__(self):
        self.queue: List = []

    async def initialise(self):
        self.queue = []

    async def teardown(self):
        self.queue = []

    def severity_score(self, severity: Severity):

        scores = {
            Severity.CRITICAL: 0,
            Severity.HIGH: 1,
            Severity.MEDIUM: 2,
            Severity.LOW: 3,
        }

        return scores[severity]

    async def push(self, case: Case):

        priority = self.severity_score(case.severity)

        heapq.heappush(self.queue, (priority, case))

    async def pop(self):

        if not self.queue:
            return None

        return heapq.heappop(self.queue)[1]

    async def list_cases(self):

        return [item[1] for item in self.queue]


case_queue = CaseQueue()