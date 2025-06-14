package com.letsgo.devcommunity.domain.post.repository;

import com.letsgo.devcommunity.domain.post.entity.TagPostMap;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Transactional
public interface TagPostMapRepository extends JpaRepository<TagPostMap, Long> {
    List<TagPostMap> findAllByTagId(Long tagId);
    Optional<TagPostMap> findByTagIdAndPostId(Long tagId, Long postId);
    List<TagPostMap> findAllByPostId(Long postId);
}
