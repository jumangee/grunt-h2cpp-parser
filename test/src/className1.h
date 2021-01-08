@banner
 
#ifndef _CLASSNAME1_H
#define _CLASSNAME1_H

#include <math.h>

typedef className1Process* (*FactoryFunction)(String, className1*, IProcessMessage*);

class ProcessFactoryReg {
	public:
		String id;
		FactoryFunction factory;
		bool isDefault;
		
		//@implement
		ProcessFactoryReg(String id, FactoryFunction factory, bool isDefault) {
			id = id;
			factory = factory;
			isDefault = isDefault;
		}
};

class className1 {
	protected:
		static className1* instance;

		className1() {
			className1::instance = this;
		}
		
	public:
		
		static className1* className1::get() {
			return className1::instance;
		}

		//@implement
		void stopAll() {
			this->processList.clear();
		}
		
		void soloProcess(String name) {
			this->stopAll();
			this->addProcess(name);
		}
		
		void sendMessage(IProcessMessage* msg) {
			for (int i = 0; i < processList.size(); i++) {
				className1Process* process = this->processList.get(i);
				if (process->handleMessage(msg) == true) {
					return;
				}
			}
		}

		//@implement
		//@include "process.h"
		void addProcess(String name) {
			this->addProcess(name, NULL);
		}
		
		//@implement
		void run() {
			if (this->processList.size() == 0) {
				ProcessFactoryReg* registration = this->findDefaultFactoryRegistration();
				if (registration) {
					addProcess(registration->id);
				} else {
					return;
				}
			}
			
			unsigned long curTime = millis();
			if (this->update(curTime)) {
				for (int i = 0; i < processList.size(); i++) {
					className1Process* process = processList.get(i);
					curTime = process->run(curTime);
				}
			}
		}

	private:
		
		void resetProcessMsTotal() {
			for (int i = 0; i < this->processList.size(); i++) {
				className1Process* process = this->processList.get(i);
				process->resetUsedMs();
			}
		}

		//@implement
		className1Process* createProcess(String name, IProcessMessage* msg) {
			ProcessFactoryReg* factoryReg = findFactoryRegistration(name);
			if (factoryReg) {
				return factoryReg->factory(name, this, msg);
			}
			return NULL;
		}

		int findProcess(String name) {
			for (int i = 0; i < processList.size(); i++) {
				className1Process* process = processList.get(i);
				if (process->isId(name)) {
					return i;
				}
			}
			return -1;
		}
		
		//@implement
		ProcessFactoryReg* findFactoryRegistration(String id) {
			for (int i = 0; i < this->factoryList.size(); i++) {
				ProcessFactoryReg* registration = factoryList.get(i);
				if (registration->id == id) {
					return registration;
				}
			}
			return NULL;
		}
		
		//@implement
		ProcessFactoryReg* findDefaultFactoryRegistration() {
			for (int i = 0; i < this->factoryList.size(); i++) {
				ProcessFactoryReg* registration = factoryList.get(i);
				if (registration->isDefault) {
					return registration;
				}
			}
			return NULL;
		}
};

#endif
