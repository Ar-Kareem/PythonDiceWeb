
from app import ParseExecService



code = r'''
function: blades ROLL:s {
 if 1@ROLL = 6 {
  result: 2 + (2@ROLL = 6)
 }
 result: 1@ROLL >= 4
}

output [blades 2@2d6] named "0d"
loop P over {1..32} {
 output [blades Pd6] named "[P]d"
}

'''


TIMEOUT = 5

def f():
    return ParseExecService(code)

def way2():
    from multiprocessing import Pool, TimeoutError
    from time import sleep

    class TimedOutExc(Exception):
        pass

    pool = Pool(processes=1)
    result = pool.apply_async(f)
    try:
        r = result.get(timeout=TIMEOUT)
        [print(i) for i in r.data]
    except TimeoutError:
        print('WAY 2 TIMEOUT')
        pool.terminate()


def way1():
    import signal
    def handler(signum, frame):
        raise Exception("end of WAY 1")
    signal.signal(signal.SIGALRM, handler)
    try:
        signal.alarm(TIMEOUT)
        r = f()
        signal.alarm(0)
        [print(i) for i in r.data]
    except Exception as e:
        # print(e)
        print("WAY 1 TIMEOUT")
        pass


if __name__ == '__main__':
    # way1()
    way2()
    import time
    time.sleep(100)
