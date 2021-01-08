#ifndef _CLASSNAME2_H
#define _CLASSNAME2_H

class className2 {
	protected:
		static className2* instance;

		//@implement
		className2() {
			className2::instance = this;
		}
		
	public:
		
		static className2* className2::get() {
			return className2::instance;
		}

		//@implement
		//@include "test.h"
		className2Process* getProcess(String name)
		{
			int pos = this->findProcess(name);
			if (pos > -1) {
				return this->processList.get(pos);
			}
			return NULL;
		}
				
		virtual void log(String msg) = 0;
			
		//@implement
		void stopProcess(String name) {
			int pos = this->findProcess(name);
			if (pos > -1) {
				this->processList.remove(pos);
			}
		}
		
		//@implement
		//@include <test22.h>
		void pauseProcess(String name, unsigned long pauseTime) {
			int pos = this->findProcess(name);
			if (pos > -1) {
				className2Process *process = this->processList.get(pos);
				process->pause(pauseTime);
			}
		}
		
	private:
		LinkedList<className2Process*> processList;
		LinkedList<ProcessFactoryReg*> factoryList;
		
		//@implement
		ProcessFactoryReg* findDefaultFactoryRegistration()
		{
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
