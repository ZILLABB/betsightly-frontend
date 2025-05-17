import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, Tab } from '../components/ui';
import { pageVariants, fadeVariants } from '../utils/animations';
import PuntersAdmin from '../components/admin/PuntersAdmin';
import BettingCodesAdmin from '../components/admin/BettingCodesAdmin';
import BookmakersAdmin from '../components/admin/BookmakersAdmin';
import { Shield, Users, Ticket, Building } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('punters');

  return (
    <motion.div
      className="container mx-auto py-8 px-4"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <motion.div 
        className="space-y-8"
        variants={fadeVariants}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/70 bg-clip-text text-transparent flex items-center gap-2"
              variants={fadeVariants}
              custom={1}
            >
              <Shield className="h-8 w-8 text-[var(--primary)]" />
              Admin Dashboard
            </motion.h1>
            <motion.p 
              className="text-[var(--muted-foreground)] mt-2"
              variants={fadeVariants}
              custom={2}
            >
              Manage punters, betting codes, and bookmakers
            </motion.p>
          </div>
        </div>

        <motion.div
          variants={fadeVariants}
          custom={3}
          className="bg-black/10 rounded-xl p-6 border border-[var(--border)] shadow-md"
        >
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="w-full"
          >
            <Tab
              eventKey="punters"
              title={
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-blue-500" />
                  <span>Punters</span>
                </div>
              }
            >
              <PuntersAdmin />
            </Tab>
            <Tab
              eventKey="betting-codes"
              title={
                <div className="flex items-center space-x-2">
                  <Ticket size={16} className="text-green-500" />
                  <span>Betting Codes</span>
                </div>
              }
            >
              <BettingCodesAdmin />
            </Tab>
            <Tab
              eventKey="bookmakers"
              title={
                <div className="flex items-center space-x-2">
                  <Building size={16} className="text-amber-500" />
                  <span>Bookmakers</span>
                </div>
              }
            >
              <BookmakersAdmin />
            </Tab>
          </Tabs>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AdminPage;
