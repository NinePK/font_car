// app/components/InsuranceInfoModal.tsx
'use client';

import { useState } from 'react';

interface InsuranceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InsuranceInfoModal({ isOpen, onClose }: InsuranceInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'rental' | 'service' | 'insurance' | 'fuel'>('rental');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-blue-600 py-4 px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl leading-6 font-medium text-white">ข้อมูลประกันรถเช่า</h3>
              <button 
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-white">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'rental'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('rental')}
                >
                  เงื่อนไขการเช่ารถขับเอง
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'service'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('service')}
                >
                  คุณสมบัติผู้เช่า/ข้อตกลง
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'insurance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('insurance')}
                >
                  เงื่อนไขประกันภัย
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'fuel'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('fuel')}
                >
                  น้ำมันและเงื่อนไขอื่นๆ
                </button>
              </nav>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'rental' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">เงื่อนไขการเช่ารถขับเอง</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>ผู้เช่ารถเช่า ต้องมีอายุ 20 ปีขึ้นไป</li>
                    <li>ผู้ขับขี่รถเช่าต้องมีใบอนุญาตขับขี่รถยนต์</li>
                    <li>ผู้ขับขี่ต้องเป็นบุคคลซึ่งระบุไว้ในสัญญาเช่าเท่านั้น</li>
                    <li>เช่ารถเป็นรายวันครบกำหนด 1 วัน ใน 24 ชั่วโมง ส่งรถคืนเกินเวลา คิดเพิ่มชั่วโมงละ 100 บาท เกิน 4 ชั่วโมงขึ้นไป คิดเป็น 1 วัน</li>
                    <li>เงินประกัน 3000 บาท</li>
                  </ol>
                </div>
              )}
              
              {activeTab === 'service' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">เงื่อนไขการให้บริการรถเช่า</h4>
                  
                  <h5 className="font-medium text-gray-900 mt-4 mb-2">1. คุณสมบัติของผู้เช่า</h5>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>คนขับต้องมีอายุ ตั้งแต่ 20 ปีขึ้นไปหรือผู้ที่มีใบขับขี่</li>
                    <li>มีใบขับขี่ไทย หรือ ใบขับขี่สากลที่ไม่หมดอายุเท่านั้น</li>
                    <li>มีบัตรประจำตัวประชาชนหรือหนังสือเดินทาง ทั้งหมดต้องเป็นตัวจริงและทั้งหมดต้องไม่หมดอายุ</li>
                  </ul>
                  
                  <h5 className="font-medium text-gray-900 mt-4 mb-2">2. ข้อตกลง</h5>
                  <ul className="list-disc pl-6 space-y-2">
                    <li className="font-semibold">ห้ามนำรถไปให้ผู้ใดใช้หรือเช่า เช่าช่วงต่อหรือ ห้ามนำไปให้ผู้ที่ไม่ได้มาทำสัญญาเช่าและไม่มีใบขับขี่เป็นคนขับรถยนต์</li>
                    <li>งดการดื่มสุราและยาเสพติดเมื่อต้องขับรถยนต์ เพราะบริษัทประกันภัยจะไม่คุ้มครอง โดยผู้เช่าจะต้องจ่ายค่าเสียหายเองทั้งหมดกรณีรถเกิดอุบัติเหตุ</li>
                    <li>ปฏิบัติตามกฎจราจรอย่างเคร่งครัด และขับขี่ด้วยความไม่ประมาท หากทำผิด กฎจราจร เช่น ขับเร็วเกินกว่ากฎหมายกำหนด หรือ ฝ่าเส้นทึบ และไฟแดง หรือ กรณีต่างๆ จนมีใบค่าปรับส่งมาที่บริษัทลูกค้าจะต้องจ่ายเองทั้งหมด โดยร้านเช่าจะเรียกเก็บกับลูกค้าอีกครั้งคำใช้จ่ายเบื้องต้น 600 บาท</li>
                    <li className="font-semibold">ผู้เช่าต้องระมัดระวังเรื่องรถหาย เมื่อรถที่เช่าหาย ท่านต้องชำระค่าเสียหายร้อยละ 50 ของราคารถยนต์ที่ประเมินไว้หรือส่วนต่างค่าใช้จ่ายส่วนเกิน ที่บริษัทประกันภัยไม่ได้คุ้มครอง โดยบริษัทประกันภัยจะจ่ายบางส่วนตามที่ระบุไว้ในกรมธรรม์</li>
                  </ul>
                </div>
              )}
              
              {activeTab === 'insurance' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">เงื่อนไขประกันภัยสำหรับรถเช่า</h4>
                  <p className="italic text-gray-600 mb-3">**หมายเหตุ ประกันภัยชั้น 1 จะไม่คุ้มครองใน 4 ประเด็นเหล่านี้</p>
                  
                  <ul className="list-disc pl-6 space-y-3">
                    <li className="font-semibold">ค่ารถยกทั้งหมด ฟรีค่ารถลากรถยก 20 กิโลเมตรแรก หลังจากนั้นลูกค้าต้อง จ่ายเองหรือตามที่ประกันภัยเรียกเก็บ(ถ้ากรณีต้องยกรถซึ่งเกิดจาก อุบัติเหตุที่ ลูกค้ากระทำหรือถูกกระทำ ลูกค้าต้องจ่ายค่ารถยก เพิ่มเติมเอง)</li>
                    <li>ยางรถยนต์ หากยางรั่วลูกค้าต้องซ่อมปะยางมาคืนบริษัทหากยางแตกลูกค้า จะต้องซื้อยาง ยี่ห้อเก่า และลายเติมให้บริษัทใหม่</li>
                    <li className="font-semibold">กระจกถ้าหากเกิดความเสียหาย ผู้เช่าจะต้องเป็นผู้รับผิดชอบ</li>
                    <li className="font-semibold">อุปกรณ์ภายในรถยนต์ทั้งหมด เช่น เอกสารภายในรถยนต์ เบาะรถยนต์ ยาง อะไหล่แม่แรง กุญแจและอื่นๆ เป็นต้น หากอุปกรณ์ที่ลูกค้าทำชำรุดหรือสูญหาย ในระหว่างการเช่ารถยนต์ ลูกค้าต้องจ่ายค่าปรับทั้งหมดตามรายการที่ร้านให้เช่าเรียกเก็บ จะใช้เกณฑ์ราคาค่าปรับตามราคาที่ศูนย์บริการรถยนต์ยี่ห้อนั้นๆ กำหนดขึ้นและค่าบริการตามจริง</li>
                    <li>กรณีรถเกิดอุบัติเหตุทางรถยนต์รถจะมีประกันภัยชั้น 1 หากลูกค้าเป็นฝ่ายผิดหรือเป็นกรณีอุบัติเหตุไม่มีคู่กรณี ลูกค้าจะต้องเสียค่าเปิดเคลมประกันตามที่บริษัทประกันภัยกำหนดและลูกค้าจะต้องรับผิดชอบรายได้ที่จะเกิดขึ้นจากการปล่อยเช่าตามจำนวนวันที่ส่งซ่อม กรณีอุบัติเหตุเล็กน้อยเช่นรอยขีดข่วนขึ้นอยู่กับการตกลงกันกับทางร้านให้เช่า</li>
                  </ul>
                </div>