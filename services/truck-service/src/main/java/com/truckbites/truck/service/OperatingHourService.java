package com.truckbites.truck.service;

import com.truckbites.common.exception.ResourceNotFoundException;
import com.truckbites.truck.model.OperatingHour;
import com.truckbites.truck.repository.OperatingHourRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperatingHourService {

    private final OperatingHourRepository operatingHourRepository;

    @Transactional(readOnly = true)
    public List<OperatingHour> getHoursByTruck(Long truckId) {
        log.debug("Fetching operating hours for truckId: {}", truckId);
        return operatingHourRepository.findByTruckIdOrderByDayOfWeekAsc(truckId);
    }

    @Transactional
    public OperatingHour setHours(Long truckId, OperatingHour hours) {
        log.info("Setting operating hours for truckId={}, dayOfWeek={}", truckId, hours.getDayOfWeek());
        hours.setTruckId(truckId);
        return operatingHourRepository.save(hours);
    }

    @Transactional
    public List<OperatingHour> setAllHours(Long truckId, List<OperatingHour> hoursList) {
        log.info("Setting all operating hours for truckId={} ({} entries)", truckId, hoursList.size());
        operatingHourRepository.deleteByTruckId(truckId);
        hoursList.forEach(h -> h.setTruckId(truckId));
        return operatingHourRepository.saveAll(hoursList);
    }

    @Transactional
    public void deleteHours(Long id) {
        operatingHourRepository.deleteById(id);
    }
}
